import WorkerCommandHandler from "@VoxelLib/Workers/WorkerUtil";
import { vec3, vec4 } from "gl-matrix";
import { ChunkData } from "./Chunk";
import { ChunkWorkerCommandMap } from "./ChunkWorkerTypes";
import { NUM_CHANNELS } from "./contants";
import { positionToStartIndexInChunk } from "./GeoUtil";
import { GenerationContext, VoxelSampleFunction } from "./World";

const generateLod = (prevLevel : ChunkData, resolution : number) => {
    const newRes = resolution / 2;
    let index = 0;
    const out = new Uint8Array(newRes * newRes * newRes * NUM_CHANNELS);

    for(let z = 0; z < newRes; z++) {
        for(let y = 0; y < newRes; y++) {
            for(let x = 0; x < newRes; x++) {
                const start = positionToStartIndexInChunk([x * 2, y * 2, z * 2], resolution);
                out.set(prevLevel.subarray(start, start + 4), index)
                index += NUM_CHANNELS;
            }
        }
    }

    return out;
}

export function createChunkWorkerFromSample(func: VoxelSampleFunction) {
    const handler = new WorkerCommandHandler<ChunkWorkerCommandMap>();

    handler.command("generate", (resolution, position, numLods) => {
        let numFilled = 0;
        const tex = new Uint8Array(resolution * resolution * resolution * NUM_CHANNELS);

        let index = tex.length - NUM_CHANNELS;

        const offsetPosition = vec3.scale(
            vec3.create(),
            position,
            resolution
        );

        const currentPos = vec3.create();
        const context: GenerationContext = {
            resolution: resolution
        }
        let data: vec4;
        for (let z = 0; z < resolution; z++) {
            for (let y = 0; y < resolution; y++) {
                for (let x = 0; x < resolution; x++) {
                    vec3.add(currentPos, [x, y, z], offsetPosition);
                    data = func(currentPos, context);
                    tex.set(data, index);
                    index -= NUM_CHANNELS;
                    if (data[3] > 0) numFilled++;
                }
            }
        }

        const lods : ChunkData[] = new Array(numLods + 1);
        lods[0] = tex;

        let res = resolution;

        for(let i = 0; i < numLods; i++) {
            lods[i + 1] = generateLod(lods[i], res);
            res /= 2;
        }

        return [lods, numFilled];
    });
}