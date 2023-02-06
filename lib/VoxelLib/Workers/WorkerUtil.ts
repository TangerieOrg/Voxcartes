import { CommandFunction, CommandMap, WorkerErrorResponse, WorkerRequest, WorkerResponse } from "./WorkerTypes";

export default class WorkerCommandHandler<TCmdMap extends CommandMap> {
    private commands : Record<keyof TCmdMap, CommandFunction<TCmdMap, keyof TCmdMap>> = {} as Record<keyof TCmdMap, CommandFunction<TCmdMap, keyof TCmdMap>>;

    constructor() {
        this.setup();
    }

    public command<K extends keyof TCmdMap>(name : K, func : CommandFunction<TCmdMap, K>) {
        this.commands[name] = func;
    }

    private setup() {
        onmessage = (ev : MessageEvent<WorkerRequest<TCmdMap, keyof TCmdMap>>) => {
            this.handleMessage(ev.data);
        }
    }

    private handleMessage(req : WorkerRequest<TCmdMap, keyof TCmdMap>) {
        if(!this.commands[req.cmd]) {
            this.respond({
                success: false,
                error: `No command ${String(req.cmd)} exists`,
                jobId: req.jobId
            })
            return;
        }
        try {
            const v = this.commands[req.cmd](...req.payload);
            this.respond({
                success: true,
                jobId: req.jobId,
                payload: v
            });
        } catch(error : any) {
            this.respond({
                success: false,
                error,
                jobId: req.jobId
            })
        }
    }

    private respond(response : WorkerResponse<TCmdMap, keyof TCmdMap>) {
        postMessage(response);
    }
}