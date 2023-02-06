import { CommandMap, WorkerCommandArguments, WorkerCommandResults, WorkerRequest, WorkerResponse } from "./WorkerTypes";

export default class WorkerPool<TCmdMap extends CommandMap> {
    private workers : Worker[] = [];
    private url : URL;
    private lastJobID = 0;
    private nextWorkerIndex = 0;

    constructor(url : URL) {
        this.url = url;
    }

    createWorkers(count : number) {
        for(let i = 0; i < count; i++) {
            const worker = new Worker(this.url, { type: "module" });
            this.workers.push(worker);
        }
    }

    private getNextWorkerID() {
        return (this.nextWorkerIndex++) % this.workers.length;
    }

    private getJobID() {
        return this.lastJobID++;
    }

    public async execute<K extends keyof TCmdMap>(cmd : K, ...payload : WorkerCommandArguments<TCmdMap, K>) {
        const id = this.getJobID();

        // Send Message
        const worker = this.sendCommandExec({
            jobId: id,
            cmd,
            payload
        });
        

        // Wait for response
        return new Promise<WorkerCommandResults<TCmdMap, K>>((resolve, reject) => {
            const listener = (ev : MessageEvent<WorkerResponse<TCmdMap, K>>) => {
                if(ev.data.jobId !== id) return;
                worker.removeEventListener("message", listener);
                
                if(ev.data.success) {
                    resolve(ev.data.payload);
                } else {
                    reject(ev.data.error);
                }
            };

            worker.addEventListener("message", listener);
        });
    }

    private sendCommandExec<K extends keyof TCmdMap>(req : WorkerRequest<TCmdMap, K>) {
        const workerId = this.getNextWorkerID();
        const worker = this.workers[workerId];
        worker.postMessage(req);
        return worker;
    }

    public dispose() {
        this.workers.forEach(w => w.terminate());
        this.workers.length = 0;
    }
}