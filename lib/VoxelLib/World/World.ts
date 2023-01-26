import { vec3, vec4 } from "gl-matrix";
import REGL, { Regl } from "regl";
import ObjectTransform from "../Shared/Object";
import { CHUNK_SIZE } from "./contants";
import { createEmptyChunk, positionToChunkPosition, positionToIndex, positionToStartIndexInChunk } from "./GeoUtil";

import { createShader } from "../Shader/ShaderUtil";
import AABBVoxelShader from "../assets/Shaders/AABBVoxelShader";
import Camera, { CameraContext } from "../Camera/Camera";
import { AsContext } from "../Shared/DataUtil";
import { ALL_CHUNK_SIDES_FILLED, Chunk, ChunkFillSide, ChunkFillSideDebugger, ChunkFillSideValue, ChunkIndex, ChunkProps, ChunkSideDirection, ChunkSideOpposing, ChunkSides, getChunkFilledSides, isChunkSideFilled } from "./Chunk";
import { createCubeDefinition } from "../Shapes/Cube";


const cubeDef = createCubeDefinition(0.499);

const aabbVoxelShader = createShader(AABBVoxelShader.source.Fragment, AABBVoxelShader.source.Vertex);

export interface GenerationContext {
    resolution : number;
}

export type VoxelSampleFunction = (pos : vec3, context : GenerationContext) => vec4;

let cPos : vec3 = vec3.create();

export default class World<RContext extends REGL.DefaultContext & AsContext<CameraContext> = any, RProps extends {} = any> {
    chunks : Map<ChunkIndex, Chunk> = new Map();

    regl : Regl;
    
    cmd : REGL.DrawCommand;

    private batches : ChunkProps[] = [];
    private currentChunk?: ChunkIndex;

    public queue : (() => void)[] = [];

    private _numVoxels = 0;
    public get numVoxels() { return this._numVoxels };

    private _numChunks = 0;
    public get numChunks() { return this._numChunks };

    constructor(regl : Regl) {
        this.regl = regl;

        this.cmd = regl({
            frag: aabbVoxelShader.Fragment,
            vert: aabbVoxelShader.Vertex,
            attributes: {
                vertex: cubeDef.vertex
            },
            elements: cubeDef.elements,
            uniforms: {
                tex: regl.prop<ChunkProps>("tex"),
                model: regl.prop<ChunkProps>("model"),
                size: regl.prop<ChunkProps>("size"),
                offset: regl.prop<ChunkProps>("offset")
            },
            cull: (ctxt, props : ChunkProps) => ({
                enable: true,
                face: props.index === this.currentChunk ? 'front' : 'back'
            })
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
        const context : GenerationContext = {
            resolution
        };
        for(let z = 0; z < resolution; z++) {
            for(let y = 0; y < resolution; y++) {
                for(let x = 0; x < resolution; x++) {
                    vec3.add(currentPosition, [x, y, z], offsetPosition);
                    data = func(currentPosition, context);
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

    popQueue() {
        this.queue.pop()?.();
    }

    private updateChunk(chunk : Chunk) {
        // Change to only update relevant parts
        chunk.texture.subimage(chunk.data);

        const prevFill = chunk.filled;
        chunk.filled = getChunkFilledSides(chunk);
        
        const chunkPosition = vec3.negate(vec3.create(), chunk.position);

        // If fill changed, calculate neighbours
        if(prevFill !== chunk.filled) {
            let sideFill = 0;
            let neighbour : Chunk | undefined;
            let opposing : number;
            const nPos = vec3.create();
            for(const side of ChunkSides) {
                vec3.add(nPos, chunkPosition, ChunkSideDirection[side]);
                neighbour = this.getChunk(nPos);
                sideFill = (ChunkFillSideValue[side] & chunk.filled);
                opposing = ChunkFillSideValue[ChunkSideOpposing[side]];

                // If neighbour empty or neighbour already has that side obscured
                if(!neighbour) continue;
                
                // if the side is now empty
                if(sideFill === 0) neighbour.neighbourObscureFlag &= ~ChunkFillSideValue[side];
                else neighbour.neighbourObscureFlag |= ChunkFillSideValue[side];
                this.updateChunkFlags(neighbour);
            }
        }

        this.updateBatches();
    }

    private updateChunkFlags(chunk : Chunk) {
        chunk.isObscured = chunk.neighbourObscureFlag === ALL_CHUNK_SIDES_FILLED;
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
            resolution,
            filled: 0,
            isObscured: false,
            neighbourObscureFlag: this.calculateNeighbourObscure(chunkPos)
        }
        v.isObscured = v.neighbourObscureFlag === ALL_CHUNK_SIDES_FILLED
        v.transform.setPosition(chunkPos);
        this.chunks.set(
            index,
            v
        );
        this.updateBatches();
        return v;
    }

    calculateNeighbourObscure(pos : vec3) : number {
        let obFlag = 0;
        const currentChunkPos = vec3.create();
        let currentChunk : Chunk | undefined;

        // Up
        vec3.add(currentChunkPos, pos, [0, 1, 0]);
        currentChunk = this.getChunk(currentChunkPos);
        if(currentChunk && isChunkSideFilled(currentChunk, "Bottom")) obFlag += ChunkFillSideValue.Top;

        // Down
        vec3.add(currentChunkPos, pos, [0, -1, 0]);
        currentChunk = this.getChunk(currentChunkPos);
        if(currentChunk && isChunkSideFilled(currentChunk, "Top")) obFlag += ChunkFillSideValue.Bottom;

        // Left
        vec3.add(currentChunkPos, pos, [1, 0, 0]);
        currentChunk = this.getChunk(currentChunkPos);
        if(currentChunk && isChunkSideFilled(currentChunk, "Right")) obFlag += ChunkFillSideValue.Left;

        // Right
        vec3.add(currentChunkPos, pos, [-1, 0, 0]);
        currentChunk = this.getChunk(currentChunkPos);
        if(currentChunk && isChunkSideFilled(currentChunk, "Left")) obFlag += ChunkFillSideValue.Right;

        // Front
        vec3.add(currentChunkPos, pos, [0, 0, 1]);
        currentChunk = this.getChunk(currentChunkPos);
        if(currentChunk && isChunkSideFilled(currentChunk, "Back")) obFlag += ChunkFillSideValue.Front;

        // Back
        vec3.add(currentChunkPos, pos, [0, 0, -1]);
        currentChunk = this.getChunk(currentChunkPos);
        if(currentChunk && isChunkSideFilled(currentChunk, "Front")) obFlag += ChunkFillSideValue.Back;

        return obFlag;
    }

    updateBatches() {
        this.batches = [...this.chunks.values()].filter(c => !c.isEmpty).map(chunk => ({
            model: chunk.transform.worldMatrix,
            offset: chunk.position,
            size: chunk.resolution,
            tex: chunk.texture,
            index: positionToIndex(chunk.position)
        }));
        this.updateStats();
    }

    getCurrentChunkPos(camera : Camera) {
        const chunkPos = vec3.divide(vec3.create(), camera.getPosition(), camera.getScale());
        vec3.negate(chunkPos, chunkPos);
        vec3.round(chunkPos, chunkPos);
        return chunkPos;
    }

    render(camera : Camera) {
        this.currentChunk = positionToIndex(this.getCurrentChunkPos(camera));
        // console.log(this.cmd.stats);
        this.cmd(this.batches.filter(
            x => 
            vec3.distance(
                x.offset, 
                vec3.scale(cPos, camera.getPosition(), 1/camera.getScale()[0]) 
            ) < 12)
        );
    }


    private updateStats() {
        this._numVoxels = 0;
        this._numChunks = this.batches.length;
        for(const c of this.batches) {
            this._numVoxels += c.size**3;
        }
    }

    startGenerationQueue() {
        const callback = () => {
            if(this.queue.length > 1) requestIdleCallback(() => callback());
            this.popQueue();
        }
        callback();
    }
}