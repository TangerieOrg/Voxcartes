export function stringify(arg : any) {
    if(typeof arg === "string") return arg;
    else if (typeof arg === "number") return arg.toFixed(2);
    else return JSON.stringify(arg);
}