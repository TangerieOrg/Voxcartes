export const deg2rad = (deg : number) => Math.PI/180 * deg;

export type AsContext<T extends {[K in keyof T]: () => any}> = {
    [K in keyof T]: ReturnType<T[K]>
}