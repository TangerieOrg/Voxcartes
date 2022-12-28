import { mat4 } from "gl-matrix";

export const createMat4 = () : mat4 => mat4.identity(new Float32Array(16));
export const deg2rad = (deg : number) => Math.PI/180 * deg;