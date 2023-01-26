export const unpackObjectToDot = (input: Record<string, any>, parentKey?: string) : Record<string, any> => Object.keys(input || {}).reduce((acc : any, key : any) => {
    const value : any = input[key];
    const outputKey = parentKey ? `${parentKey}.${key}` : `${key}`;

    // NOTE: remove `&& (!Array.isArray(value) || value.length)` to exclude empty arrays from the output
    if (value && typeof value === 'object' && (!Array.isArray(value))) return ({ ...acc, ...unpackObjectToDot(value, outputKey) });

    return ({ ...acc, [outputKey]: value });
}, {});