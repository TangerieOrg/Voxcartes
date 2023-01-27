import Camera from "@VoxelLib/Camera";
import Renderer from "@VoxelLib/Renderer";
import World from "@VoxelLib/World/World";
import { DefaultContext, Regl } from "regl";

export type SceneContext = DefaultContext;

export default class Scene {
    regl : Regl;
    camera : Camera;
    renderer : Renderer;
    world : World;
    
    // world : World;

    constructor(regl : Regl) {
        this.regl = regl;
        this.camera = new Camera(this.regl);
        this.renderer = new Renderer(this.regl, this.camera);
        this.world = new World(this);
    }

    onLoad() {}
    onUnload() {}
    onFrame(ctxt : SceneContext) {}
}