import REGL from "regl";
import Scene from "@VoxelLib/Scene";

export default class GameScene extends Scene {
    onLoad(): void {
        this.camera.setPosition([0, 0, 3]);
        this.camera.rotate([0, Math.PI, 0]);
        // this.camera.setScale([4, 4, 4]);

        this.world.generateFromFunction([0, 0, 0], [2, 2, 2], ([x, y, z], context) => [
            (x / (context.resolution)) * 255, 
            (y / (context.resolution)) * 255, 
            (z / (context.resolution)) * 255, 
            255
        ], 8);

        this.renderer.debug.set("Camera Position", () => this.camera.getPosition());
        this.renderer.debug.set("Num Voxels", () => this.world.numVoxels);
        this.renderer.debug.set("Num Chunks", () => this.world.numChunks);
        this.renderer.debug.set("Chunk Queue", () => this.world.queue.length);
    }

    onFrame(ctxt: REGL.DefaultContext): void {
        this.world.popQueue();
        this.world.render(this.camera);
    }
}