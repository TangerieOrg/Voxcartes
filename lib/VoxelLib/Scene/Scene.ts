import Camera from "@VoxelLib/Camera";
import Renderer from "@VoxelLib/Renderer";
import World from "@VoxelLib/World/World";
import { DefaultContext, Regl } from "regl";
import SceneMemberMixin from "./SceneMemberMixin";

export type SceneContext = DefaultContext;

export interface SceneMemberContext {
    regl : Regl;
    scene : Scene;
}

export default class Scene {
    regl : Regl;
    camera : Camera;
    renderer : Renderer;
    world : World;
    
    // world : World;

    constructor(regl : Regl) {
        this.regl = regl;
        this.camera = this.addWithContext(Camera);
        this.renderer = new Renderer(this.regl, this.camera);
        this.world = new World(this);
    }

    addWithContext(Thing : any) {
        return new Thing({ regl: this.regl, scene: this});
    }

    onLoad() {}
    onUnload() {}
    onFrame(ctxt : SceneContext) {}
}