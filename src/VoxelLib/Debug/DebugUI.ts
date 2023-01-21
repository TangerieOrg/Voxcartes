export type DebugUIValueType<T = any> = (() => T) | T;

interface DebugMapValue<T = any> {
    valueEl : HTMLParagraphElement,
    titleEl : HTMLParagraphElement,
    value: DebugUIValueType<T>
}

export default class DebugUI {
    private values : Record<string, DebugMapValue> = {};

    private htmlEl = document.getElementById("debug") as HTMLDivElement;

    set<T>(key : string, value : DebugUIValueType<T>) {
        if(!this.values[key]) {
            this.values[key] = {
                value,
                valueEl: document.createElement("p"),
                titleEl: document.createElement("p"),
            }
            this.values[key].titleEl.innerText = key;
            this.htmlEl.appendChild(this.values[key].titleEl);
            this.htmlEl.appendChild(this.values[key].valueEl);
        }

        this.updateSingle(this.values[key]!);
    }

    private updateSingle(v : DebugMapValue) {
        const { valueEl, value: rawValue } = v;

            const value = typeof rawValue === "function" ? rawValue() : rawValue;
        
            if(Array.isArray(value)) {
                valueEl.innerText = value.join(" ");
            } else if (typeof value === "number" || typeof value === "bigint") {
                valueEl.innerText = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            } else {
                valueEl.innerText = String(value);
            }
    }

    update() {
        for(const v of Object.values(this.values)) this.updateSingle(v);
    }
}