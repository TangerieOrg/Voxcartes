import { mat4, vec3 } from "gl-matrix";


const emptyMat4 = () => new Float32Array(16) as mat4;

interface SerializedCamera {
    version : number;
    fov : number;
    eye : vec3;
    center: vec3;
    up : vec3;
}

export default class Camera {
    domElement : HTMLCanvasElement;
    fov : number;
    eye : vec3;
    center: vec3;
    up : vec3;

    constructor(domElement : HTMLCanvasElement) {
        this.domElement = domElement;
        this.fov = Math.PI / 6;
        this.eye = [0, 0, 4];
        this.center = [0, 0, 0];
        this.up = [0, 1, 0];
    }

    view(m = emptyMat4()) {
        return mat4.lookAt(m, this.eye, this.center, this.up);
    }

    projection(m = emptyMat4()) {
        return mat4.perspective(
            m,
            this.fov,
            this.domElement.width / this.domElement.height, // Aspect
            0.1, // Near
            1000 // Far
        )
    }

    projectionView(m = emptyMat4()) {
        return mat4.multiply(m, this.projection(), this.view());
    }

    inverseProjectionView(m = emptyMat4()) {
        this.projectionView(m);
        return mat4.invert(m, m);
    }

    serialize() : SerializedCamera {
        return {
            version: 0,
            fov: this.fov,
            eye: this.eye,
            center: this.center,
            up: this.up
        }
    }

    deserialize(cfg : SerializedCamera) {
        this.fov = cfg.fov;
        this.eye = cfg.eye;
        this.center = cfg.center;
        this.up = cfg.up;
    }
}