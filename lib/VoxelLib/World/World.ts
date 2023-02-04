import { vec3, vec4 } from "gl-matrix";
import REGL, { Regl } from "regl";
import ObjectTransform from "../Shared/Object";
import { CHUNK_SIZE } from "./contants";
import { createEmptyChunk, positionToChunkPosition, positionToIndex, positionToStartIndexInChunk } from "./GeoUtil";

import { createShader } from "../Shader/ShaderUtil";
import AABBVoxelShader from "../assets/Shaders/AABBVoxelShader";
import Camera, { CameraContext } from "../Camera/Camera";
import { AsContext } from "../Shared/DataUtil";
import { ALL_CHUNK_SIDES_FILLED, Chunk, ChunkFillSide, ChunkFillSideDebugger, ChunkFillSideValue, ChunkIndex, ChunkProps, ChunkSideDirection, ChunkSideOpposing, ChunkSides, generateChunkLods, generateLod, getChunkFilledSides, isChunkSideFilled } from "./Chunk";
import { createCubeDefinition } from "../Shapes/Cube";
import Scene from "@VoxelLib/Scene";
import { throttle } from "lodash";


const cubeDef = createCubeDefinition(0.499);

const aabbVoxelShader = createShader(AABBVoxelShader.source.Fragment, AABBVoxelShader.source.Vertex);

export interface GenerationContext {
    resolution: number;
}

export type VoxelSampleFunction = (pos: vec3, context: GenerationContext) => vec4;

let cPos: vec3 = vec3.create();

export default class World<RContext extends REGL.DefaultContext & AsContext<CameraContext> = any, RProps extends {} = any> {
    chunks: Map<ChunkIndex, Chunk> = new Map();

    regl: Regl;

    cmd: REGL.DrawCommand;

    private scene: Scene;

    private batches: ChunkProps[] = [];

    private batchViewDistances: ChunkProps[][] = [];

    public currentChunk: vec3 = vec3.create();

    public queue: (() => void)[] = [];

    private _numVoxels = 0;
    public get numVoxels() { return this._numVoxels };

    private _numChunks = 0;
    public get numChunks() { return this._numChunks };

    private dirtyChunks : ChunkIndex[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
        this.regl = scene.regl;

        this.cmd = this.regl({
            frag: aabbVoxelShader.Fragment,
            vert: aabbVoxelShader.Vertex,
            attributes: {
                vertex: cubeDef.vertex
            },
            elements: cubeDef.elements,
            uniforms: {
                tex: this.regl.prop<ChunkProps>("tex"),
                model: this.regl.prop<ChunkProps>("model"),
                size: this.regl.prop<ChunkProps>("size"),
                offset: this.regl.prop<ChunkProps>("offset"),
                lod: this.regl.prop<ChunkProps>("lod"),
                isCameraIn: (ctxt, props : ChunkProps) => {
                    return vec3.equals(this.currentChunk, props.offset)
                }
            },
            cull: (ctxt, props: ChunkProps) => ({
                enable: true,
                face: vec3.equals(this.currentChunk, props.offset) ? 'front' : 'back'
            })
        });

        this.scene.camera.emitter.on("move", throttle(this.updateBatchViewDistances.bind(this), 100));
    }

    setVoxel(pos: vec3, value: vec4, update = true, resolution = CHUNK_SIZE) {
        const chunkPosition = positionToChunkPosition(pos, resolution);
        const chunk = this.getOrCreateChunk(chunkPosition, resolution);
        const posInChunk = vec3.clone(pos).map(x => x % resolution) as vec3;
        const startIndex = positionToStartIndexInChunk(posInChunk, resolution);
        chunk.data.set(value, startIndex);
        const index = positionToIndex(chunkPosition);

        if (value[3] > 0) {
            chunk.isEmpty = false;
        }

        this.dirtyChunks.push(index);

        // if (update) this.updateChunk(chunk);
        return this;
    }

    setChunkFromFunction(chunkPos: vec3, func: VoxelSampleFunction, update = true, resolution = CHUNK_SIZE) {
        const chunk = this.getOrCreateChunk(chunkPos, resolution);
        chunk.isEmpty = true;
        let index = positionToStartIndexInChunk([0, 0, 0], resolution);
        const offsetPosition = vec3.create();
        vec3.scale(offsetPosition, chunkPos, resolution);
        const currentPosition = vec3.create();
        let data: vec4;
        const context: GenerationContext = {
            resolution
        };
        for (let z = 0; z < resolution; z++) {
            for (let y = 0; y < resolution; y++) {
                for (let x = 0; x < resolution; x++) {
                    vec3.add(currentPosition, [x, y, z], offsetPosition);
                    data = func(currentPosition, context);
                    chunk.data.set(data, index)
                    index += 4;
                    if (data[3] > 0) {
                        chunk.isEmpty = false;
                    }
                }
            }
        }
        this.dirtyChunks.push(positionToIndex(chunkPos));
        // if (update) this.updateChunk(chunk);
        return this;
    }

    generateFromFunction(minChunk: vec3, maxChunk: vec3, func: VoxelSampleFunction, resolution = CHUNK_SIZE) {
        for (let x = minChunk[0]; x < maxChunk[0]; x++) {
            for (let y = minChunk[1]; y < maxChunk[1]; y++) {
                for (let z = minChunk[2]; z < maxChunk[2]; z++) {
                    this.setChunkFromFunction([x, y, z], func, true, resolution);
                }
            }
        }

        return this;
    }

    createGenerationQueue(minChunk: vec3, maxChunk: vec3, func: VoxelSampleFunction, resolution = CHUNK_SIZE) {
        const queue: [() => void, vec3][] = [];

        for (let x = minChunk[0]; x < maxChunk[0]; x++) {
            for (let y = minChunk[1]; y < maxChunk[1]; y++) {
                for (let z = minChunk[2]; z < maxChunk[2]; z++) {
                    queue.push([() => this.setChunkFromFunction([x, y, z], func, true, resolution), [x, y, z]]);
                }
            }
        }

        queue.sort(([_, a], [__, b]) => {
            return vec3.distance([4, 4, 0], b) - vec3.distance([4, 4, 0], a);
        })

        this.queue.push(...queue.map(x => x[0]));

    }

    popQueue() {
        this.queue.pop()?.();
    }

    private updateDirtyChunks() {
        this.dirtyChunks.forEach(x => this.updateChunk(this.chunks.get(x)!));
        this.dirtyChunks.length = 0;
    }

    private updateChunk(chunk: Chunk) {
        // Change to only update relevant parts
        chunk.texture.subimage(chunk.data, 0, 0, 0, 0);

        generateChunkLods(chunk, 2).forEach((lod, index) => {
            chunk.texture.subimage(lod, 0, 0, 0, index + 1);
        })

        chunk.filled = getChunkFilledSides(chunk);


        this.updateBatches();
    }
    getChunk(pos: vec3) {
        return this.chunks.get(positionToIndex(pos));
    }

    getOrCreateChunk(pos: vec3, resolution: number) {
        let chunk = this.getChunk(pos);
        if (chunk) return chunk;
        return this.createChunk(pos, resolution);
    }

    createChunk(pos: vec3, resolution: number) {
        const index = positionToIndex(pos);
        const data = createEmptyChunk(resolution);
        const chunkPos = vec3.create();
        vec3.negate(chunkPos, pos);

        const v: Chunk = {
            position: chunkPos,
            data,
            texture: this.regl.texture3D({
                width: resolution,
                height: resolution,
                depth: resolution,
                format: "rgba",
                data,
                mipmap: true
            }),
            transform: new ObjectTransform(),
            isEmpty: true,
            resolution,
            filled: 0
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
            tex: chunk.texture,
            index: positionToIndex(chunk.position),
            lod: 0
        }));
        this.updateBatchViewDistances();
        this.updateStats();
    }

    getCurrentChunkPos(camera: Camera) {
        const chunkPos = vec3.divide(vec3.create(), camera.getPosition(), camera.getScale());
        vec3.negate(chunkPos, chunkPos);
        vec3.round(chunkPos, chunkPos);
        return chunkPos;
    }

    private updateBatchViewDistances() {
        // console.log("Updating Batches");
        const camera = this.scene.camera;

        const batchOffsets = [5, 8, 12];

        this.batchViewDistances = Array(batchOffsets.length).fill(0).map(() => []);
        const camPos = vec3.scale(cPos, camera.getPosition(), 1 / camera.getScale()[0]);
        for(const chunk of this.batches) {
            const distance = vec3.distance(chunk.offset, camPos);
            for(let index = 0; index < batchOffsets.length; index++) {
                if(distance < batchOffsets[index]) {
                    this.batchViewDistances[index].push(chunk);
                    chunk.lod = index;
                    break;
                }
            }
        }
        
    }


    render(camera: Camera) {
        this.currentChunk = vec3.negate(this.currentChunk, this.getCurrentChunkPos(camera));
        for(const b of this.batchViewDistances) {
            this.cmd(b);
        }
        this.updateDirtyChunks();
    }


    private updateStats() {
        this._numVoxels = 0;
        this._numChunks = this.batches.length;
        for (const c of this.batches) {
            this._numVoxels += c.size ** 3;
        }
    }

    startGenerationQueue() {
        const callback = () => {
            if (this.queue.length > 1) requestIdleCallback(() => callback());
            this.popQueue();
        }
        callback();
    }
}