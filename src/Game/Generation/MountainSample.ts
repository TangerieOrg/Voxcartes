import { createChunkWorkerFromSample } from "@VoxelLib/World/ChunkWorkerUtil";
import { VoxelSampleFunction } from "@VoxelLib/World/World";
import { createNoise2D, createNoise3D } from "simplex-noise";

const noise2d = createNoise2D();
const NOISE_SCALE = 140;

const noise3d = createNoise3D();

const sample: VoxelSampleFunction = ([x, y, z], context) => {
    const floorHeight = (noise2d(x / NOISE_SCALE, z / NOISE_SCALE) * 0.5 + 0.5) * context.resolution * 1.5 + context.resolution;
    return [
        x / (context.resolution * 32) * 255,
        y / (context.resolution * 3) * 255,
        z / (context.resolution * 32) * 255,
        y < floorHeight ? 255 : 0
    ]
};

createChunkWorkerFromSample(sample);

// createChunkWorkerFromSample(([x, y, z], context) => {
//     const xPerc = x / (context.resolution * 4);
//     const yPerc = y / (context.resolution * 4);
//     const zPerc = z / (context.resolution * 4);
//     const s = noise3d(x / NOISE_SCALE, y / NOISE_SCALE, z / NOISE_SCALE)
//     return [
//         xPerc * 255,
//         yPerc * 255,
//         zPerc * 255,
//         s > 0 ? 255 : 0
//     ]
// })