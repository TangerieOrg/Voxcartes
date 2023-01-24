import REGL from "regl";
import Scene from "@VoxelLib/Scene";

export default class GameScene extends Scene {
    onLoad(): void {
        this.camera.setPosition([0, 0, 8]);
        this.camera.rotate([0, Math.PI, 0]);
        this.camera.setScale([4, 4, 4]);

        this.world.generateFromFunction([0, 0, 0], [3, 1, 1], ([x, y, z], context) => [
            (x / (context.resolution)) * 255, 
            (y / (context.resolution)) * 255, 
            (z / (context.resolution)) * 255, 
            255
        ], 32);
    }

    onFrame(ctxt: REGL.DefaultContext): void {
        this.world.popQueue();
        this.world.render(this.camera);
    }
}