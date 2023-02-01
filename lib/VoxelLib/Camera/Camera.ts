import { SceneMemberContext } from "@VoxelLib/Scene/Scene";
import SceneMemberMixin from "@VoxelLib/Scene/SceneMemberMixin";
import EventEmitter from "@VoxelLib/Utility/EventEmitter";
import { applyMixins } from "@VoxelLib/Utility/Mixin";
import { unpackObjectToDot } from "@VoxelLib/Utility/UniformUtil";
import { mat4, vec3, quat } from "gl-matrix";
import { throttle } from "lodash";
import REGL, { DrawCommand, Regl } from "regl";
import InputManager from "../InputManager/InputManager";
import { AsContext, deg2rad } from "../Shared/DataUtil";
import ObjectTransform from "../Shared/Object";

export interface CameraContext {
    view : () => mat4;
    projection : () => mat4;
    viewProjection : () => mat4;
    cameraPosition : () => vec3;
    cameraRotation : () => quat;
    cameraScale : () => vec3;
}

export type CameraEventMap = {
    "move": [position : vec3]
};

export default interface Camera extends SceneMemberContext, ObjectTransform {}

export default class Camera extends ObjectTransform {
    fov : number = 75;
    zNear : number = 0.0001;
    zFar : number = 40;

    projectionMatrix : mat4 = mat4.create();
    viewMatrix : mat4 = mat4.create();
    viewProjectionMatrix : mat4 = mat4.create();

    moveSpeed = 0.08;
    turnSpeed = 0.02;

    private isDirty = false;

    use : DrawCommand;

    emitter : EventEmitter<CameraEventMap> = new EventEmitter();

    private emitOnMove : () => any;

    constructor({ scene, regl } : SceneMemberContext) {
        super();
        this.scene = scene;
        this.regl = regl;
        this.updateCameraMatrix();
        window.addEventListener("resize", () => this.updateCameraMatrix());

        const uniforms = unpackObjectToDot({
            camera: {
                view: () => this.viewMatrix,
                projection: () => this.projectionMatrix,
                viewProjection: () => this.viewProjectionMatrix,
                position: () => this.position,
                rotation: () => this.rotation,
                scale: () => this.scale,
                fov: () => this.fov,
                zPlanes: () => [this.zNear, this.zFar]
            }
        });
        this.use = this.regl({
            uniforms
        });

        this.emitOnMove = throttle(() => {
            this.emitter.emit("move", this.position)
        }, 100)
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
        mat4.scale(this.viewMatrix, this.viewMatrix, this.scale);
        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
    }

    createContext() : CameraContext {
        return {
            view: () => this.viewMatrix,
            projection: () => this.projectionMatrix,
            viewProjection: () => this.viewProjectionMatrix,
            cameraPosition: () => this.position,
            cameraRotation: () => this.rotation,
            cameraScale: () => this.scale
        }
    }

    handleInput() {
        const dir: vec3 = vec3.create();

        if (InputManager.isKeyDown("w")) {
            dir[2] = this.moveSpeed;
            this.isDirty = true;
        } else if (InputManager.isKeyDown("s")) {
            dir[2] = -this.moveSpeed;
            this.isDirty = true;
        }

        if (InputManager.isKeyDown("a")) {
            dir[0] = this.moveSpeed;
            this.isDirty = true;
        } else if (InputManager.isKeyDown("d")) {
            dir[0] = -this.moveSpeed;
            this.isDirty = true;
        }

        if (InputManager.isKeyDown(" ")) {
            dir[1] = -this.moveSpeed;
            this.isDirty = true;
        } else if (InputManager.isKeyDown("Shift")) {
            dir[1] = this.moveSpeed;
            this.isDirty = true;
        }

        if (InputManager.isKeyDown("q")) {
            quat.rotateY(this.rotation, this.rotation, this.turnSpeed);
            this.isDirty = true;
        } else if (InputManager.isKeyDown("e")) {
            quat.rotateY(this.rotation, this.rotation, -this.turnSpeed);
            this.isDirty = true;
        }

        if (this.isDirty) {
            const cam = mat4.copy(mat4.create(), this.rotationMatrix);
            vec3.transformMat4(dir, dir, cam);
            vec3.add(this.position, this.position, dir);
            this.updateMatrices();
            this.isDirty = false;
            this.emitOnMove();
        }
    }
}

applyMixins(Camera, SceneMemberMixin);