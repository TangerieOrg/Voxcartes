import { mat4, vec3, quat } from "gl-matrix";
import REGL, { Regl } from "regl";
import { AsContext, deg2rad } from "../Shared/DataUtil";
import ObjectTransform from "../Shared/Object";

export interface CameraContext {
    view : () => mat4;
    projection : () => mat4;
    viewProjection : () => mat4;
    cameraPosition : () => vec3;
    cameraRotation : () => quat;
}

export default class Camera extends ObjectTransform {
    regl : Regl;

    fov : number = 75;
    zNear : number = 0.0001;
    zFar : number = 100;

    projectionMatrix : mat4 = mat4.create();
    viewMatrix : mat4 = mat4.create();
    viewProjectionMatrix : mat4 = mat4.create();

    constructor(regl : Regl) {
        super();
        this.regl = regl;
        this.updateCameraMatrix();

        window.addEventListener("resize", () => this.updateCameraMatrix());
    }

    getAspect() {
        const canvas = this.regl._gl.canvas;

        return canvas.width / canvas.height;
    }

    updateMatrices() {
        this.updateWorldMatrix();
        this.updateCameraMatrix();
    }

    updateCameraMatrix() {
        // Create projection matrix
        mat4.perspective(this.projectionMatrix, deg2rad(this.fov), this.getAspect(), this.zNear, this.zFar);

        // Create view matrix (inverse of camera matrix) => offset everything by opposite of camera
        mat4.invert(this.viewMatrix, this.worldMatrix);
        
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }

    createContext() : CameraContext {
        return {
            view: () => this.viewMatrix,
            projection: () => this.projectionMatrix,
            viewProjection: () => this.viewProjectionMatrix,
            cameraPosition: () => this.position,
            cameraRotation: () => this.rotation
        }
    }
}