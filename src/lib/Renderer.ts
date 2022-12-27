import REGL, { Regl } from "regl"

export default class Renderer {
    regl : Regl;
    clear: (options: REGL.ClearOptions) => void;

    constructor() {
        this.regl = REGL();

        this.clear = this.regl.clear.bind(this.regl);
    }
}