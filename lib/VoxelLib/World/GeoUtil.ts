import { vec3 } from "gl-matrix";
import { NUM_CHANNELS } from "./contants";

export const createEmptyChunk = (resolution : number) => 
    new Uint8Array(resolution * resolution * resolution * NUM_CHANNELS);

export const positionToIndex = (pos : vec3) => 
    (pos[0] << 16) | (pos[1] << 8) | pos[2];

export const positionToChunkPosition = (pos : vec3, resolution : number) => 
    pos.map(x => Math.floor(x / resolution)) as vec3;

export const positionToStartIndexInChunk = (pos : vec3, resolution : number) => 
    (pos[0] + pos[1] * resolution + pos[2] * resolution * resolution) * NUM_CHANNELS;