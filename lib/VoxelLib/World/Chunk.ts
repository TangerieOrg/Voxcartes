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
    lods : ChunkData[];
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

        this.lods = [];
        let r = this.resolution;
        for(let i = 1; i < NUM_LODS + 1; i++) {
            r = r / 2;
            this.lods[i - 1] = new Uint8Array(r * r * r * NUM_CHANNELS);
        } 

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

    setFromFunction(func : VoxelSampleFunction) {
        this.numFilled = 0;
        let index = this.data.length - NUM_CHANNELS;
        
        const offsetPosition = vec3.scale(
            vec3.create(),
            this.position,
            this.resolution
        );

        const currentPos = vec3.create();
        const context : GenerationContext = {
            resolution: this.resolution
        }
        let data: vec4;
        for (let z = 0; z < this.resolution; z++) {
            for (let y = 0; y < this.resolution; y++) {
                for (let x = 0; x < this.resolution; x++) {
                    vec3.add(currentPos, [x, y, z], offsetPosition);
                    data = func(currentPos, context);
                    this.data.set(data, index);
                    index -= NUM_CHANNELS;
                    if (data[3] > 0) this.numFilled++;
                }
            }
        }

        this.dirty = true;
    }

    async setFromWorker(pool : WorkerPool<ChunkWorkerCommandMap>) {
        const [[data, ...lods], numFilled] = await pool.execute("generate", this.resolution, this.position, this.lods.length);
        this.data.set(data, 0);
        
        if(this.numFilled === 0 && numFilled === 0) return;
        
        this.numFilled = numFilled;

        for(let i = 0; i < lods.length; i++) {
            this.lods[i].set(lods[i]);
        }

        this.dirty = true;
    }

    update() {
        this.texture.subimage(this.data, 0, 0, 0, 0);

        for(let i = 0; i < this.lods.length; i++) {
            this.texture.subimage(this.lods[i], 0, 0, 0, i + 1);
        }
        this.dirty = false;
    }

    private positionToIndex(pos : vec3) {
        return (pos[0] + pos[1] * this.resolution + pos[2] * this.resolution * this.resolution) * NUM_CHANNELS;
    }
}