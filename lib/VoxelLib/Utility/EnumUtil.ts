export const BitflagDebugger = (bitflag : Record<string, number>) => (value : number) => {
    const output : string[] = [];

    for(const [key, flag] of Object.entries(bitflag)) {
        if((value & flag) !== 0) output.push(key)
    }

    return output;
}

export const BitflagMaxValue = (bitflag : Record<string, number>) => Math.pow(2, Object.values(bitflag).length) - 1;