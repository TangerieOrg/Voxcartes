export type DebugUIValueType<T = any> = (() => T) | T;

interface DebugMapValue<T = any> {
    valueEl: HTMLParagraphElement,
    titleEl: HTMLParagraphElement,
    value: DebugUIValueType<T>
    units : string;
}

interface TrackedDebugMap extends DebugMapValue<number> {
    last : number;
}

export default class DebugUI {
    private values: Record<string, DebugMapValue> = {};
    private trackedValues: Record<string, TrackedDebugMap> = {};

    private htmlEl = document.getElementById("debug") as HTMLDivElement;


    private create(key: string) {
        const valueEl = document.createElement("p");
        const titleEl = document.createElement("p");
        titleEl.innerText = key;
        this.htmlEl.appendChild(titleEl);
        this.htmlEl.appendChild(valueEl);
        return { valueEl, titleEl }
    }

    set<T>(key: string, value: DebugUIValueType<T>, units = "") {
        if (!this.values[key]) {
            const { titleEl, valueEl } = this.create(key);
            this.values[key] = {
                value,
                valueEl,
                titleEl,
                units
            }
        }

        this.updateSingle(this.values[key]!);
    }

    trackDifference(key: string, value: DebugUIValueType<number>, units = "") {
        if (!this.trackedValues[key]) {
            const { titleEl, valueEl } = this.create(key);
            this.trackedValues[key] = {
                value,
                valueEl,
                titleEl,
                last: typeof value === "function" ? value() : value,
                units
            }
        }
    }

    setObject(obj: Record<string, any>) {
        for (const key in obj) {
            this.set(key, () => obj[key])
        }
    }

    private updateTracked(v: TrackedDebugMap) {
        const { valueEl, value: rawValue, last, units } = v;
        const currentValue = typeof rawValue === "function" ? rawValue() : rawValue;
        const diff = currentValue - last;
        v.last = currentValue;
        this.setText(valueEl, diff / 30, units);
    }

    private setText(valueEl : DebugMapValue["valueEl"], value : any, units : string) {
        if (Array.isArray(value)) {
            valueEl.innerText = value.join(" ");
        } else if (typeof value === "number") {
            valueEl.innerText = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " " + units;
        } else {
            valueEl.innerText = String(value);
        }
    }

    private updateSingle(v: DebugMapValue) {
        const { valueEl, value: rawValue, units } = v;

        const value = typeof rawValue === "function" ? rawValue() : rawValue;
        this.setText(valueEl, value, units);
    }

    update() {
        for (const v of Object.values(this.values)) this.updateSingle(v);
        for (const v of Object.values(this.trackedValues)) this.updateTracked(v);
    }
}