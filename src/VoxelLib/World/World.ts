import { vec3, vec4 } from "gl-matrix";
import REGL, { DrawCommand, Regl, Texture3D } from "regl";
import ObjectTransform from "../Shared/Object";
import { CHUNK_SIZE } from "./contants";
import { createEmptyChunk, positionToChunkPosition, positionToIndex, positionToStartIndexInChunk } from "./GeoUtil";

import { createShader } from "../Shader/ShaderUtil";
import VoxelShader from "../assets/VoxelShader";
import { CameraContext } from "../Camera/Camera";
import { AsContext } from "../Shared/DataUtil";
import { ChunkProps } from "./Chunk";
import CubeDefinition from "../Shapes/Cube";

export type ChunkIndex = number;
export type ChunkData = Uint8Array;
export interface Chunk {
    position : vec3;
    data : ChunkData;
    texture : Texture3D;
    transform : ObjectTransform;
    isEmpty : boolean;
}

const voxelShader = createShader(VoxelShader.source.Fragment, VoxelShader.source.Vertex);

export type VoxelSampleFunction = (pos : vec3) => vec4;

export default class World<RContext extends REGL.DefaultContext & AsContext<CameraContext>, RProps extends {}> {
    chunks : Map<ChunkIndex, Chunk> = new Map();

    regl : Regl;
    
    cmd : REGL.DrawCommand;

    private scale = 1;

    private batches : ChunkProps[] = [];

    constructor(regl : Regl) {
        this.regl = regl;

        this.cmd = regl({
            frag: voxelShader.source.Fragment,
            vert: voxelShader.source.Vertex,
            attributes: {
                vertex: CubeDefinition.vertex
            },
            elements: CubeDefinition.elements,
            uniforms: {
                tex: regl.prop<ChunkProps>("tex"),
                model: regl.prop<ChunkProps>("model"),
                size: regl.prop<ChunkProps>("size"),
                offset: regl.prop<ChunkProps>("offset")
            }
        });
    }

    setVoxel(pos : vec3, value : vec4, update = true) {
        const chunkPosition = positionToChunkPosition(pos);
        const chunk = this.getOrCreateChunk(chunkPosition);
        const posInChunk = vec3.clone(pos).map(x => x % CHUNK_SIZE) as vec3;
        const startIndex = positionToStartIndexInChunk(posInChunk);
        chunk.data.set(value, startIndex);

        if(value[3] > 0) {
            chunk.isEmpty = false;
        }

        if(update) this.updateChunk(chunk);
        return this;
    }

    setChunkFromFunction(chunkPos : vec3, func : VoxelSampleFunction, update = true) {
        const chunk = this.getOrCreateChunk(chunkPos);
        chunk.isEmpty = true;
        let index = positionToStartIndexInChunk([0, 0, 0]);
        const offsetPosition = vec3.create();
        vec3.scale(offsetPosition, chunkPos, CHUNK_SIZE);
        const currentPosition = vec3.create();
        let data : vec4;
        for(let z = 0; z < CHUNK_SIZE; z++) {
            for(let y = 0; y < CHUNK_SIZE; y++) {
                for(let x = 0; x < CHUNK_SIZE; x++) {
                    vec3.add(currentPosition, [x, y, z], offsetPosition);
                    data = func(currentPosition);
                    chunk.data.set(data, index)
                    index += 4;
                    if(data[3] > 0) {
                        chunk.isEmpty = false;
                    }
                }
            }
        }
        if(update) this.updateChunk(chunk);
        return this;
    }


    generateFromFunction(minChunk : vec3, maxChunk : vec3, func : VoxelSampleFunction) {
        for(let x = minChunk[0]; x < maxChunk[0]; x++) {
            for(let y = minChunk[1]; y < maxChunk[1]; y++) {
                for(let z = minChunk[2]; z < maxChunk[2]; z++) {
                    this.setChunkFromFunction([x, y, z], func);
                }
            }
        }

        return this;
    }

    private updateChunk(chunk : Chunk) {
        // Change to only update relevant parts
        chunk.texture.subimage(chunk.data);
        this.updateBatches()
    }

    getChunk(pos : vec3) {
        return this.chunks.get(positionToIndex(pos));
    }

    getOrCreateChunk(pos : vec3) {
        let chunk = this.getChunk(pos);
        if(chunk) return chunk;
        return this.createChunk(pos);
    }

    createChunk(pos : vec3) {
        const index = positionToIndex(pos);
        const data = createEmptyChunk();
        const chunkPos = vec3.create();
        vec3.negate(chunkPos, pos);
        
        const v : Chunk = {
            position: chunkPos,
            data,
            texture: this.regl.texture3D({
                width: CHUNK_SIZE,
                height: CHUNK_SIZE,
                depth: CHUNK_SIZE,
                format: "rgba",
                data
            }),
            transform: new ObjectTransform(),
            isEmpty: true
        }
        v.transform.setPosition(chunkPos);
        this.chunks.set(
            index,
            v
        );
        this.updateBatches();
        return v;
    }

    updateBatches() {
        this.batches = [...this.chunks.values()].filter(c => !c.isEmpty).map(chunk => ({
            model: chunk.transform.worldMatrix,
            offset: chunk.position,
            size: CHUNK_SIZE,
            tex: chunk.texture
        }));
    }

    setScale(scale : number) {
        if(scale === this.scale) return;
        
    }

    render() {
        this.cmd(this.batches);
    }
}