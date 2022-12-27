import { Material } from "./Material";

const MAX_DIM = 256;

export default class VoxelIndex {
    aRGB : Uint8Array;
    aRMET : Float32Array;
    aRi : Float32Array;
    x : number = 0;
    y : number = 0;
    keys : Record<string, [number, number]> = {};

    constructor() {
        this.aRGB = new Uint8Array(MAX_DIM * MAX_DIM * 3);
        this.aRMET = new Float32Array(MAX_DIM * MAX_DIM * 4);
        this.aRi = new Float32Array(MAX_DIM * MAX_DIM * 4);
        this.clear();
    }

    clear() {
        this.aRGB.fill(0);
        this.aRMET.fill(0);
        this.aRi.fill(0);
        this.x = 1;
        this.y = 0;
        this.keys = {};
    }

    get(v : Material) {
        const key = `${v.red} ${v.green} ${v.blue} ${v.rough} ${v.metal} ${v.emit} ${v.transparent} ${v.refract}`;

        if(this.keys[key]) return this.keys[key];

        this.x++;
        if(this.x > MAX_DIM - 1) {
            this.x = 0;
            this.y++;
            if(this.y > MAX_DIM - 1) throw new Error (`Exceeded voxel material limit of ${MAX_DIM * MAX_DIM}`)
        }

        this.keys[key] = [this.x, this.y];

        const i = this.y * MAX_DIM + this.x;
        
        this.aRGB[i * 3 + 0] = v.red;
        this.aRGB[i * 3 + 1] = v.green;
        this.aRGB[i * 3 + 2] = v.blue;

        this.aRMET[i * 4 + 0] = v.rough;
        this.aRMET[i * 4 + 1] = v.metal;
        this.aRMET[i * 4 + 2] = v.emit;
        this.aRMET[i * 4 + 3] = v.refract;

        return this.keys[key];
    }
}