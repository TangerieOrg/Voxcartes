import ObjectTransform from "@VoxelLib/Shared/Object";
import WorkerPool from "@VoxelLib/Workers/WorkerPool";
import { vec3, vec4 } from "gl-matrix";
import { DefaultContext, MaybeDynamicUniforms, Regl, Texture3D } from "regl";
import { ChunkWorkerCommandMap } from "./ChunkWorkerTypes";
import { NUM_CHANNELS } from "./contants";
import { positionToStartIndexInChunk } from "./GeoUtil";
import { GenerationContext, VoxelSampleFunction } from "./World";

const NUM_LODS = 2;

export type ChunkData = Uint8Array;
export type ChunkIndex = string;

export const ChunkUniforms : MaybeDynamicUniforms<{}, DefaultContext, Chunk> = {
    tex: (ctxt : DefaultContext, chunk : Chunk) => chunk.texture,
    model: (ctxt : DefaultContext, chunk : Chunk) => chunk.worldMatrix,
    size: (ctxt : DefaultContext, chunk : Chunk) => chunk.resolution,
    offset: (ctxt : DefaultContext, chunk : Chunk) => chunk.getPosition(),
    lod: (ctxt : DefaultContext, chunk : Chunk) => chunk.lod,
    isCameraIn: (ctxt : DefaultContext & { currentChunk : ChunkIndex }, chunk : Chunk) => chunk.index === ctxt.currentChunk
};

export default class Chunk extends ObjectTransform {
    data : ChunkData;
    texture : Texture3D;
    numFilled : number;
    resolution : number;
    regl : Regl;
    dirty : boolean;
    lod : number;

    public readonly index : ChunkIndex;

    constructor(regl : Regl, position : vec3, resolution : number) {
        super();
        this.dirty = false;
        this.regl = regl;
        this.resolution = resolution;
        this.numFilled = 0;
        this.data = new Uint8Array(resolution * resolution * resolution * NUM_CHANNELS);
        this.texture = regl.texture3D({
            width: resolution,
            height: resolution,
            depth: resolution,
            format: "rgba",
            data: this.data,
            mipmap: true,
            type: "uint8"
        });

        this.setPosition(position);
        this.index = this.position.join(",");

        this.lod = 0;
    }

    setVoxel(pos : vec3, value : vec4) {
        const index = this.positionToIndex(pos);
        const prevAlpha = this.data.at(index + 3)!;
        this.data.set(value, index);
        if(prevAlpha > 0 && value[3] === 0) {
            this.numFilled--;
        } else if (prevAlpha === 0 && value[3] > 0) {
            this.numFilled++;
        }

        this.dirty = true;
    }


    async setFromWorker(pool : WorkerPool<ChunkWorkerCommandMap>) {
        const [data, numFilled] = await pool.execute("generate", [this.resolution, this.position, this.data], [this.data.buffer]);
        // this.data.set(data, 0);
        this.data = new Uint8Array(data);
        if(this.numFilled === 0 && numFilled === 0) return;
        
        this.numFilled = numFilled;

        this.dirty = true;
    }

    update() {
        this.texture({
            width: this.resolution,
            height: this.resolution,
            depth: this.resolution,
            format: "rgba",
            data: this.data,
            mipmap: true,
            type: "uint8"
        });
        this.dirty = false;
    }

    private positionToIndex(pos : vec3) {
        return (pos[0] + pos[1] * this.resolution + pos[2] * this.resolution * this.resolution) * NUM_CHANNELS;
    }
}