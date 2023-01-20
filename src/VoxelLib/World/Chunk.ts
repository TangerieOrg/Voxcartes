import { mat4, vec3 } from "gl-matrix";
import { Texture3D } from "regl";
import ObjectTransform from "../Shared/Object";


export interface ChunkProps {
    tex: Texture3D;
    model: mat4;
    size: number;
    offset: vec3;
}


export type ChunkIndex = number;
export type ChunkData = Uint8Array;
export interface Chunk {
    position : vec3;
    data : ChunkData;
    texture : Texture3D;
    transform : ObjectTransform;
    isEmpty : boolean;
    resolution: number;
}