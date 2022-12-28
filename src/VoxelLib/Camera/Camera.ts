import { mat4, vec3 } from "gl-matrix";
import { Regl } from "regl";
import { createMat4, deg2rad } from "../Shared/DataUtil";

const EMPTY_MAT4 = createMat4();

export default class Camera {
    position : vec3 = [0, 0, 0];
    rotation : vec3 = [0, 0, 0];

    regl : Regl;

    fov : number = 75;
    zNear : number = 0.0001;
    zFar : number = 100;

    projectionMatrix : mat4 = createMat4();
    cameraMatrix : mat4 = createMat4();
    viewMatrix : mat4 = createMat4();
    viewProjectionMatrix : mat4 = createMat4();

    constructor(regl : Regl) {
        this.regl = regl;
        this.updateMatrices();
    }

    getAspect() {
        const canvas = this.regl._gl.canvas;

        return canvas.width / canvas.height;
    }

    updateMatrices() {
        // Create projection matrix
        mat4.perspective(this.projectionMatrix, deg2rad(this.fov), this.getAspect(), this.zNear, this.zFar);

        // Create world matrix for camera
        mat4.rotateX(this.cameraMatrix, EMPTY_MAT4, this.rotation[0]);
        mat4.rotateY(this.cameraMatrix, this.cameraMatrix, this.rotation[1]);
        mat4.rotateZ(this.cameraMatrix, this.cameraMatrix, this.rotation[2]);
        mat4.translate(this.cameraMatrix, this.cameraMatrix, [this.position[0], this.position[1], -this.position[2]]);

        // Create view matrix (inverse of camera matrix) => offset everything by opposite of camera
        mat4.invert(this.viewMatrix, this.cameraMatrix);
        
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }
}