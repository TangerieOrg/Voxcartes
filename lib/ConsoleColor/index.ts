const COLORS = [
    "black",
    "silver",
    "gray",
    "white",
    "maroon",
    "red",
    "purple",
    "fuchsia",
    "green",
    "lime",
    "olive",
    "yellow",
    "navy",
    "blue",
    "teal",
    "aqua",
    "cyan"
] as const;

type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType> ? ElementType : never;

export type ColorType = ElementType<typeof COLORS>;

export const ColorStyles : Record<ColorType, string> = (() => {
    const c : any = {};
    for(const color of COLORS) c[color] = "color:" + color;

    return c;
})();


export function ColorLog(color : ColorType, text : string) {
    console.log("%c" + text, ColorStyles[color]);
}