import WorkerCommandHandler from "@VoxelLib/Workers/WorkerUtil";
import { vec3, vec4 } from "gl-matrix";
import { ChunkWorkerCommandMap } from "./ChunkWorkerTypes";
import { NUM_CHANNELS } from "./contants";
import { GenerationContext, VoxelSampleFunction } from "./World";


export function createChunkWorkerFromSample(func: VoxelSampleFunction) {
    const handler = new WorkerCommandHandler<ChunkWorkerCommandMap>();

    handler.command("generate", (resolution, position, tex) => {
        let numFilled = 0;
        // const tex = new Uint8Array(buffer);
        // const tex = new Uint8Array(resolution * resolution * resolution * NUM_CHANNELS);
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
        
        return [tex.buffer, numFilled];
    });
}