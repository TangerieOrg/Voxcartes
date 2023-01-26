import { vec3 } from "gl-matrix";

export interface DirectionalLight {
    direction : vec3;
    albedo : vec3;
    intensity : number;
}