import Scene, { SceneMemberContext } from "./Scene";
import { Regl } from "regl";

export default class SceneMemberMixin {
    scene! : Scene;
    regl! : Regl;

    constructor({scene, regl} : SceneMemberContext) {
        this.scene = scene;
        this.regl = regl;
    }
}