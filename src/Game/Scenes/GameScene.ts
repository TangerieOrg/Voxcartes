import REGL, { DrawCommand } from "regl";
import Scene from "@VoxelLib/Scene";
import SceneManager from "@VoxelLib/Scene/SceneManager";

export default class GameScene extends Scene {
    onLoad(): void {
        this.camera.setPosition([0, 0, -12]);
        // this.camera.rotate([0, Math.PI, 0]);
        this.camera.setScale([2, 2, 2]);

        // this.renderer.setConfig({
        //     maxResolution: -1
        // })

        this.world.addChunkWorker(
            "sphere", 
            // @ts-ignore
            new URL("../Generation/SphereSample.ts", import.meta.url),
            2
        );

        // this.world.addChunkWorker(
        //     "floor", 
        //     // @ts-ignore
        //     new URL("../Generation/FloorSample.ts", import.meta.url),
        //     1
        // );

        // this.world.addChunkWorker(
        //     "mountain", 
        //     // @ts-ignore
        //     new URL("../Generation/MountainSample.ts", import.meta.url),
        //     1
        // );


        // this.world.generateFromWorker([0, 0, 0], [4, 1, 1], "floor", 8);
        // this.world.generateFromWorker([0, 1, 0], [32, 3, 32], "mountain", 64);

        this.world.generateFromWorker([-4, -4, -4], [4, 4, 4], "sphere", 64);

        const cmds: [string, DrawCommand][] = [
            ["Chunk", this.world.cmd],
            ["Lighting", this.renderer.renderFBO],
            ["PostProcessing", this.renderer.postProcessing.drawEffect]
        ];

        if (SceneManager.isDebug) {
            for (const [name, cmd] of cmds) {
                this.renderer.debug.trackDifference(`[${name}] GPU`, () => cmd.stats.gpuTime, "ms/frame");
                this.renderer.debug.trackDifference(`[${name}] CPU`, () => cmd.stats.cpuTime, "ms/frame");
                this.renderer.debug.trackDifference(`[${name}] Count`, () => cmd.stats.count, "call/frame");
            }
        }

        this.renderer.postProcessing.addByName(
            "Lighting.Directional",
            "Effects.Fog",
            "Effects.FXAA",
            "Tonemapping.ACES"
        );

    }

    onFrame(ctxt: REGL.DefaultContext): void {
        this.world.render();
    }
}