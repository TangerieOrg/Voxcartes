import { vec3, vec4 } from "gl-matrix";
import REGL, { DefaultContext, Regl } from "regl";
import { CHUNK_SIZE } from "./contants";
import { positionToIndex } from "./GeoUtil";

import { createShader } from "../Shaders/ShaderUtil";
import AABBVoxelShader from "../Shaders/GLSL/AABBVoxelShader";
import Camera, { CameraContext } from "../Camera/Camera";
import { AsContext } from "../Shared/DataUtil";
import { createCubeDefinition } from "../Shapes/Cube";
import Scene from "@VoxelLib/Scene";
import { throttle } from "lodash";
import Chunk, { ChunkUniforms, ChunkIndex } from "./Chunk";
import WorkerPool from "@VoxelLib/Workers/WorkerPool";
import { ChunkWorkerCommandMap } from "./ChunkWorkerTypes";

const cubeDef = createCubeDefinition(0.5);

const aabbVoxelShader = createShader(AABBVoxelShader.source.Fragment, AABBVoxelShader.source.Vertex);

export interface GenerationContext {
    resolution: number;
}

export type VoxelSampleFunction = (pos: vec3, context: GenerationContext) => vec4;

let cPos: vec3 = vec3.create();

export default class World<RContext extends REGL.DefaultContext & AsContext<CameraContext> = any, RProps extends {} = any> {
    chunks: Map<string, Chunk> = new Map();

    regl: Regl;

    cmd: REGL.DrawCommand;

    private scene: Scene;

    private batchViewDistances: Chunk[][] = [];

    public currentChunk: ChunkIndex = "";

    public queue: (() => void)[] = [];

    private chunkWorkers : Record<string, WorkerPool<ChunkWorkerCommandMap>> = {};

    public maxChunkUpdates = 5;

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
            uniforms: ChunkUniforms,
            cull: (ctxt : DefaultContext & { currentChunk : ChunkIndex }, chunk : Chunk) => ({
                enable: true,
                face: ctxt.currentChunk === chunk.index ? 'front' : 'back'
            }),
            context: {
                currentChunk: () => this.currentChunk
            }
        });

        this.scene.camera.emitter.on("move", throttle(this.updateBatchViewDistances.bind(this), 100));

        
    }

    addChunkWorker(name : string, url : URL, count = 1) {
        if(this.chunkWorkers[name]) return;
        this.chunkWorkers[name] = new WorkerPool(url);
        this.chunkWorkers[name].createWorkers(count);
    }

    setChunkFromWorker(name : string, chunkPos: vec3, resolution = CHUNK_SIZE) {
        const pool = this.chunkWorkers[name];
        if(!pool) {
            console.warn(`No worker ${name}`);
            return;
        }

        this.getOrCreateChunk(chunkPos, resolution).setFromWorker(pool);
    }

    generateFromWorker(minChunk: vec3, maxChunk: vec3, name : string, resolution = CHUNK_SIZE) {
        const pool = this.chunkWorkers[name];
        if(!pool) {
            console.warn(`No worker ${name}`);
            return;
        }
        
        for (let x = minChunk[0]; x < maxChunk[0]; x++) {
            for (let y = minChunk[1]; y < maxChunk[1]; y++) {
                for (let z = minChunk[2]; z < maxChunk[2]; z++) {
                    this.getOrCreateChunk([x, y, z], resolution).setFromWorker(pool)
                }
            }
        }
    }


    private updateDirtyChunks() {
        let numUpdates = 0;
        
        for(const [_, chunk] of this.chunks) {
            if(chunk.dirty) {
                chunk.update();
                numUpdates++;
            }
            if(numUpdates >= this.maxChunkUpdates) break;
        }

        if(numUpdates > 0) this.updateBatchViewDistances();
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
        const chunk = new Chunk(this.regl, pos, resolution);
        this.chunks.set(
            chunk.index,
            chunk
        );
        return chunk;
    }

    getCurrentChunkPos(camera: Camera) {
        const chunkPos = vec3.divide(vec3.create(), camera.getPosition(), camera.getScale());
        // vec3.negate(chunkPos, chunkPos);
        vec3.round(chunkPos, chunkPos);
        return chunkPos;
    }

    private updateBatchViewDistances() {
        // console.log("Updating Batches");
        const camera = this.scene.camera;

        const batchOffsets = [5, 10, 30];

        this.batchViewDistances = Array(batchOffsets.length).fill(0).map(() => []);
        const camPos = vec3.scale(cPos, camera.getPosition(), 1 / camera.getScale()[0]);
        for(const [_, chunk] of this.chunks) {
            if(chunk.numFilled === 0) continue;
            const distance = vec3.distance(chunk.getPosition(), camPos);
            for(let index = 0; index < batchOffsets.length; index++) {
                if(distance < batchOffsets[index]) {
                    this.batchViewDistances[index].push(chunk);
                    chunk.lod = index;
                    break;
                }
            }
        }

        // Sort the first group
        this.sortChunksByCameraDistance(this.batchViewDistances[0]);
        
    }


    render() {
        this.currentChunk = this.getCurrentChunkPos(this.scene.camera).join(",");
        for(const b of this.batchViewDistances) {
            this.cmd(b);
        }
        this.updateDirtyChunks();
    }


    sortChunksByCameraDistance(chunks : Chunk[]) {
        const camPos = this.getCurrentChunkPos(this.scene.camera);
        chunks.sort((a, b) => {
            return vec3.squaredDistance(camPos, a.getPosition()) - vec3.squaredDistance(camPos, b.getPosition());
        })
    }
}