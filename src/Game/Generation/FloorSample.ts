import { createChunkWorkerFromSample } from "@VoxelLib/World/ChunkWorkerUtil";
import { VoxelSampleFunction } from "@VoxelLib/World/World";

const floorSample: VoxelSampleFunction = ([x, y, z], context) => {
    return [
        x / (context.resolution * 32) * 255,
        y / (context.resolution * 3) * 255,
        z / (context.resolution * 32) * 255,
        255
    ]
};

createChunkWorkerFromSample(floorSample);