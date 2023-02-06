import { createChunkWorkerFromSample } from "@VoxelLib/World/ChunkWorkerUtil";
import { VoxelSampleFunction } from "@VoxelLib/World/World";
import { vec3 } from "gl-matrix";
import { createNoise3D } from "simplex-noise";

const NOISE_SCALE = 0.5;

const RADIUS = 128;
const CENTER = vec3.fromValues(32 * 4, 32 * 4, 32 * 4);
const noise3d = createNoise3D();
const sphereSample: VoxelSampleFunction = ([x, y, z], context) => {
    const distance = vec3.distance(CENTER, [x, y, z]);
    const s = noise3d(x / NOISE_SCALE / distance, y / NOISE_SCALE / distance, z / NOISE_SCALE / distance) * 0.5 + 0.5;
    return [
        x / (context.resolution * 8) * 255,
        y / (context.resolution * 8) * 255,
        z / (context.resolution * 8) * 255,
        distance < RADIUS && s > 0.5 ? 255 : 0
    ]
};

createChunkWorkerFromSample(sphereSample);