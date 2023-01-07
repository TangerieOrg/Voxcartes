import { vec3 } from "gl-matrix";
import { CHUNK_SIZE, NUM_CHANNELS } from "./contants";

export const createEmptyChunk = () => 
    new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE * NUM_CHANNELS);

export const positionToIndex = (pos : vec3) => 
    (pos[0] << 16) | (pos[1] << 8) | pos[2];

export const positionToChunkPosition = (pos : vec3) => 
    pos.map(x => Math.floor(x / CHUNK_SIZE)) as vec3;

export const positionToStartIndexInChunk = (pos : vec3) => 
    (pos[0] + pos[1] * CHUNK_SIZE + pos[2] * CHUNK_SIZE * CHUNK_SIZE) * NUM_CHANNELS;