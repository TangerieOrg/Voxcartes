export default class DebugUI {
    private values : Record<string, { valueEl : HTMLParagraphElement, titleEl : HTMLParagraphElement, value : any}> = {};

    private htmlEl = document.getElementById("debug") as HTMLDivElement;

    set(key : string, value : any) {
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

        const { valueEl } = this.values[key]!;
        
        if(Array.isArray(value)) {
            valueEl.innerText = value.join(" ");
        } else if (typeof value === "number" || typeof value === "bigint") {
            valueEl.innerText = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            valueEl.innerText = String(value);
        }
    }
}