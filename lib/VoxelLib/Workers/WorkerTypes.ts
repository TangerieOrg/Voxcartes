
export type CommandMapValue<TArgs extends any[] = any[], TResult extends any = any> = [TArgs, TResult];

export type CommandMap = Record<string, CommandMapValue>;

export type WorkerCommandArguments<TCmdMap extends CommandMap, K extends keyof TCmdMap> = TCmdMap[K][0]; 
export type WorkerCommandResults<TCmdMap extends CommandMap, K extends keyof TCmdMap> = TCmdMap[K][1]; 
export type CommandFunction<TCmdMap extends CommandMap, K extends keyof TCmdMap> = (...args : WorkerCommandArguments<TCmdMap, K>) => WorkerCommandResults<TCmdMap, K>;


interface BaseWorkerMessage {
    jobId : number;
}


export interface WorkerSuccessResponse<TCmdMap extends CommandMap, K extends keyof TCmdMap> extends BaseWorkerMessage {
    success : true;
    payload : WorkerCommandResults<TCmdMap, K>;
}

export interface WorkerErrorResponse extends BaseWorkerMessage {
    success : false;
    error : string;
}

export type WorkerResponse<TCmdMap extends CommandMap, K extends keyof TCmdMap> = WorkerSuccessResponse<TCmdMap, K> | WorkerErrorResponse;

export interface WorkerRequest<TCmdMap extends CommandMap, K extends keyof TCmdMap> extends BaseWorkerMessage {
    cmd : K;
    payload : WorkerCommandArguments<TCmdMap, K>;
}

