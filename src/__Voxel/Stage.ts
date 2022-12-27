import { vec3 } from "gl-matrix";
import { Regl, Texture2D } from "regl";
import { Material } from "./Material";
import VoxelIndex from "./VoxelIndex";

interface DataItem extends Material {
    x : number;
    y : number;
    z : number;
}

export default class Stage {
    regl: Regl;
    width: number;
    height: number;
    depth: number;
    data: Record<string, DataItem>;
    vIndex: VoxelIndex;
    tIndex: Texture2D;
    tRGB: Texture2D;
    tRMET: Texture2D;
    tRi: Texture2D;
    textureSize : number = 1;

    constructor(regl: Regl, width: number, height: number, depth: number) {
        this.regl = regl;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.data = {};
        this.vIndex = new VoxelIndex();
        this.tIndex = regl.texture();
        this.tRGB = regl.texture();
        this.tRMET = regl.texture();
        this.tRi = regl.texture();
    }

    key(...[x, y, z] : vec3) {
        return `${x} ${y} ${z}`;
    }

    set(x : number, y : number, z : number, {red = 1, green = 1, blue = 1, rough = 1, metal = 0, emit = 0, transparent = 0, refract = 1} : Partial<Material>) {
        if (x < 0 || x >= this.width) throw new Error("Vixel: set out of bounds.");
        if (y < 0 || y >= this.height) throw new Error("Vixel: set out of bounds.");
        if (z < 0 || z >= this.depth) throw new Error("Vixel: set out of bounds.");

        this.data[this.key(x, y, z)] = {
            x,
            y,
            z,
            red: Math.round(red * 255),
            green: Math.round(green * 255),
            blue: Math.round(blue * 255),
            rough,
            metal,
            emit,
            transparent,
            refract,
        };
    }

    unset(...[x, y, z] : vec3) {
        if (Object.keys(this.data).length === 1) return;
        delete this.data[this.key(x, y, z)];
    }

    get(...[x, y, z] : vec3) {
        return this.data[this.key(x, y, z)];
    }

    update() {
        this.textureSize = 1;
        while (
          this.textureSize * this.textureSize <
          this.width * this.height * this.depth
        ) {
          this.textureSize *= 2;
        }
        const aIndex = new Uint8Array(this.textureSize * this.textureSize * 2);
        aIndex.fill(0);
        for (let [_, v] of Object.entries(this.data)) {
          const vi = this.vIndex.get(v);
          const ai = v.y * this.width * this.depth + v.z * this.width + v.x;
          aIndex[ai * 2 + 0] = vi[0];
          aIndex[ai * 2 + 1] = vi[1];
        }
        this.tIndex({
          width: this.textureSize,
          height: this.textureSize,
          format: "luminance alpha",
          data: aIndex,
        });
        this.tRGB({
          width: 256,
          height: 256,
          format: "rgb",
          data: this.vIndex.aRGB,
        });
        this.tRMET({
          width: 256,
          height: 256,
          format: "rgba",
          type: "float",
          data: this.vIndex.aRMET,
        });
        this.tRi({
          width: 256,
          height: 256,
          format: "rgba",
          type: "float",
          data: this.vIndex.aRi,
        });
    }
}