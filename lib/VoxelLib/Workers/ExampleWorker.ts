import { ExampleWorkerCommandMap } from "./ExampleWorkerTypes";
import WorkerCommandHandler from "./WorkerUtil";

const add = (a : number, b : number) => a + b;



const handler = new WorkerCommandHandler<ExampleWorkerCommandMap>();

handler.command("add", add);
