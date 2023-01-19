import { mat4, quat, vec3 } from "gl-matrix";

const EMPTY_MAT4 = mat4.create();


export default class ObjectTransform {
    position = vec3.create();
    rotation = quat.create();

    translationMatrix = mat4.create();
    rotationMatrix = mat4.create();
    localMatrix = mat4.create();
    worldMatrix = mat4.create();


    parent? : ObjectTransform;
    children : ObjectTransform[] = [];

    constructor() {}

    updateWorldMatrix() {
        mat4.fromQuat(this.rotationMatrix, this.rotation);
        mat4.translate(this.translationMatrix, EMPTY_MAT4, [-this.position[0], -this.position[1], -this.position[2]]);
        
        
        mat4.multiply(this.localMatrix, this.translationMatrix, this.rotationMatrix);
        
        if(this.parent) mat4.multiply(this.worldMatrix, this.localMatrix, this.parent.worldMatrix);
        else mat4.copy(this.worldMatrix, this.localMatrix);

        this.updateChildren();

        return this;
    }

    updateChildren() {
        this.children.forEach(child => child.updateMatrices());
    }

    updateMatrices() {
        this.updateWorldMatrix();
    }

    setPosition(pos : vec3) {
        vec3.copy(this.position, pos);
        this.updateMatrices();
    }

    translatePosition(pos : vec3) {
        vec3.add(this.position, this.position, pos);
        this.updateMatrices();
    }

    rotate(xyz : vec3) {
        quat.rotateX(this.rotation, this.rotation, xyz[0]);
        quat.rotateY(this.rotation, this.rotation, xyz[1]);
        quat.rotateZ(this.rotation, this.rotation, xyz[2]);
        this.updateMatrices();
    }
}