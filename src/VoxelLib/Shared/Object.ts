import { mat4, quat, vec3 } from "gl-matrix";
import { Regl } from "regl";

const EMPTY_MAT4 = mat4.create();


export default class ObjectTransform {
    position = vec3.create();
    rotation = quat.create();

    translationMatrix = mat4.create();
    rotationMatrix = mat4.create();
    worldMatrix = mat4.create();

    constructor() {}

    updateWorldMatrix() {
        mat4.fromQuat(this.rotationMatrix, this.rotation);
        mat4.translate(this.translationMatrix, EMPTY_MAT4, [-this.position[0], -this.position[1], -this.position[2]]);
        mat4.multiply(this.worldMatrix, this.translationMatrix, this.rotationMatrix);
        return this;
    }

    updateMatrices() {
        this.updateWorldMatrix();
    }

    setPosition(pos : vec3) {
        vec3.copy(this.position, pos);
        this.updateWorldMatrix();
    }

    translatePosition(pos : vec3) {
        vec3.add(this.position, this.position, pos);
        this.updateWorldMatrix();
    }

    rotate(xyz : vec3) {
        quat.rotateX(this.rotation, this.rotation, xyz[0]);
        quat.rotateY(this.rotation, this.rotation, xyz[1]);
        quat.rotateZ(this.rotation, this.rotation, xyz[2]);
        this.updateMatrices();
    }
}