import { vec3, vec4 } from "gl-matrix";
import REGL, { DrawCommand, Regl, Texture3D } from "regl";
import ObjectTransform from "../Shared/Object";
import { CHUNK_SIZE } from "./contants";
import { createEmptyChunk, positionToChunkPosition, positionToIndex, positionToStartIndexInChunk } from "./GeoUtil";

import { createShader } from "../Shader/ShaderUtil";
import SVOShader from "../assets/SVOShader";
import { CameraContext } from "../Camera/Camera";
import { AsContext } from "../Shared/DataUtil";
import { Chunk, ChunkIndex, ChunkProps } from "./Chunk";
import { createCubeDefinition } from "../Shapes/Cube";


const cubeDef = createCubeDefinition(0.5);

const voxelShader = createShader(SVOShader.source.Fragment, SVOShader.source.Vertex);

export type VoxelSampleFunction = (pos : vec3) => vec4;

export default class World<RContext extends REGL.DefaultContext & AsContext<CameraContext>, RProps extends {}> {
    chunks : Map<ChunkIndex, Chunk> = new Map();

    regl : Regl;
    
    cmd : REGL.DrawCommand;

    private scale = 1;

    private batches : ChunkProps[] = [];

    public queue : (() => void)[] = [];

    private _numVoxels = 0;
    public get numVoxels() { return this._numVoxels }

    constructor(regl : Regl) {
        this.regl = regl;

        this.cmd = regl({
            frag: voxelShader.source.Fragment,
            vert: voxelShader.source.Vertex,
            attributes: {
                vertex: cubeDef.vertex
            },
            elements: cubeDef.elements,
            uniforms: {
                tex: regl.prop<ChunkProps>("tex"),
                model: regl.prop<ChunkProps>("model"),
                size: regl.prop<ChunkProps>("size"),
                offset: regl.prop<ChunkProps>("offset")
            }
        });
    }

    setVoxel(pos : vec3, value : vec4, update = true, resolution=CHUNK_SIZE) {
        const chunkPosition = positionToChunkPosition(pos, resolution);
        const chunk = this.getOrCreateChunk(chunkPosition, resolution);
        const posInChunk = vec3.clone(pos).map(x => x % resolution) as vec3;
        const startIndex = positionToStartIndexInChunk(posInChunk, resolution);
        chunk.data.set(value, startIndex);

        if(value[3] > 0) {
            chunk.isEmpty = false;
        }

        if(update) this.updateChunk(chunk);
        return this;
    }

    setChunkFromFunction(chunkPos : vec3, func : VoxelSampleFunction, update = true, resolution=CHUNK_SIZE) {
        const chunk = this.getOrCreateChunk(chunkPos, resolution);
        chunk.isEmpty = true;
        let index = positionToStartIndexInChunk([0, 0, 0], resolution);
        const offsetPosition = vec3.create();
        vec3.scale(offsetPosition, chunkPos, resolution);
        const currentPosition = vec3.create();
        let data : vec4;
        for(let z = 0; z < resolution; z++) {
            for(let y = 0; y < resolution; y++) {
                for(let x = 0; x < resolution; x++) {
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

    generateFromFunction(minChunk : vec3, maxChunk : vec3, func : VoxelSampleFunction, resolution = CHUNK_SIZE) {
        for(let x = minChunk[0]; x < maxChunk[0]; x++) {
            for(let y = minChunk[1]; y < maxChunk[1]; y++) {
                for(let z = minChunk[2]; z < maxChunk[2]; z++) {
                    this.setChunkFromFunction([x, y, z], func, true, resolution);
                }
            }
        }

        return this;
    }

    createGenerationQueue(minChunk : vec3, maxChunk : vec3, func : VoxelSampleFunction, resolution=CHUNK_SIZE) {
        const queue : [() => void, vec3][] = [];
        
        for(let x = minChunk[0]; x < maxChunk[0]; x++) {
            for(let y = minChunk[1]; y < maxChunk[1]; y++) {
                for(let z = minChunk[2]; z < maxChunk[2]; z++) {
                    queue.push([() => this.setChunkFromFunction([x, y, z], func, true, resolution),[x,y,z]]);
                }
            }
        }

        queue.sort(([_, a], [__, b]) => {
            return -vec3.sqrLen(a) + vec3.sqrLen(b);
        })

        this.queue.push(...queue.map(x => x[0]));
        
    }

    popQueue() { this.queue.pop()?.(); }

    private updateChunk(chunk : Chunk) {
        // Change to only update relevant parts
        chunk.texture.subimage(chunk.data);
        this.updateBatches()
    }

    getChunk(pos : vec3) {
        return this.chunks.get(positionToIndex(pos));
    }

    getOrCreateChunk(pos : vec3, resolution : number) {
        let chunk = this.getChunk(pos);
        if(chunk) return chunk;
        return this.createChunk(pos, resolution);
    }

    createChunk(pos : vec3, resolution : number) {
        const index = positionToIndex(pos);
        const data = createEmptyChunk(resolution);
        const chunkPos = vec3.create();
        vec3.negate(chunkPos, pos);
        
        const v : Chunk = {
            position: chunkPos,
            data,
            texture: this.regl.texture3D({
                width: resolution,
                height: resolution,
                depth: resolution,
                format: "rgba",
                data
            }),
            transform: new ObjectTransform(),
            isEmpty: true,
            resolution
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
            size: chunk.resolution,
            tex: chunk.texture
        }));
        this.updateNumVoxels();
    }

    setScale(scale : number) {
        if(scale === this.scale) return;
        
    }

    render() {
        this.cmd(this.batches);
    }

    private updateNumVoxels() {
        this._numVoxels = 0;

        for(const c of this.chunks.values()) {
            if(c.isEmpty) continue;
            this._numVoxels += c.resolution**3;
        }
    }

    updateNearby(position : vec3, distance : number, func : VoxelSampleFunction) {

    }
}