import { vec3 } from "gl-matrix"
import { ChunkData } from "./Chunk"

export type ChunkWorkerCommandMap = {
    generate: [[resolution : number, position : vec3, data : ArrayBufferLike], [data : ArrayBufferLike, numFilled : number]]
}