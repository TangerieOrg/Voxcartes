import { createChunkWorkerFromSample } from "@VoxelLib/World/ChunkWorkerUtil";
import { VoxelSampleFunction } from "@VoxelLib/World/World";
import { vec3 } from "gl-matrix";
import { createNoise3D } from "simplex-noise";
import Alea from "alea";

const prng = Alea(0);

const NOISE_SCALE = 0.5;

const RADIUS = 256;
const noise3d = createNoise3D(prng);
const sphereSample: VoxelSampleFunction = ([x, y, z], context) => {
    const distance = vec3.length([x, y, z]);
    const s = noise3d((x + context.resolution * 4) / NOISE_SCALE / distance, (y + context.resolution * 4) / NOISE_SCALE / distance, (z + context.resolution * 4) / NOISE_SCALE / distance) * 0.5 + 0.5;
    return [
        (x + context.resolution * 4) / (context.resolution * 8) * 255,
        (y + context.resolution * 4) / (context.resolution * 8) * 255,
        (z + context.resolution * 4) / (context.resolution * 8) * 255,
        distance < RADIUS && s > 0.5 ? 255 : 0
    ]
};

createChunkWorkerFromSample(sphereSample);