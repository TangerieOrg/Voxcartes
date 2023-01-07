import { mat4, vec3 } from "gl-matrix";
import { Texture3D } from "regl";


export interface ChunkProps {
    tex: Texture3D;
    model: mat4;
    size: number;
    offset: vec3;
}
