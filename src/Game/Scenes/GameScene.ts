import REGL, { DrawCommand } from "regl";
import Scene from "@VoxelLib/Scene";
import SceneManager from "@VoxelLib/Scene/SceneManager";

export default class GameScene extends Scene {
    onLoad(): void {
        this.camera.setPosition([4, 4, -8]);
        // this.camera.rotate([0, Math.PI, 0]);
        this.camera.setScale([2, 2, 2]);

        this.renderer.setConfig({
            maxResolution: -1
        })

        this.world.addChunkWorker(
            "sphere", 
            // @ts-ignore
            new URL("../Generation/SphereSample.ts", import.meta.url),
            4
        );

        this.world.generateFromWorker([0, 0, 0], [8, 8, 8], "sphere", 32);

        const cmds: [string, DrawCommand][] = [
            ["Chunk", this.world.cmd],
            ["Lighting", this.renderer.renderFBO],
            ["PostProcessing", this.renderer.postProcessing.drawEffect]
        ];

        if (SceneManager.isDebug) {
            this.renderer.debug.set("Frame Time", () => this.renderer.frameTime, "ms");
            for (const [name, cmd] of cmds) {
                this.renderer.debug.trackDifference(`[${name}] GPU`, () => cmd.stats.gpuTime, "ms/frame");
                this.renderer.debug.trackDifference(`[${name}] CPU`, () => cmd.stats.cpuTime, "ms/frame");
                this.renderer.debug.trackDifference(`[${name}] Count`, () => cmd.stats.count, "call/frame");
            }
        }

        this.renderer.postProcessing.addByName(
            "Lighting.Directional",
            "Effects.Fog",
            "Tonemapping.ACES",
            "Effects.FXAA"
        );

    }

    onFrame(ctxt: REGL.DefaultContext): void {
        this.world.render();
    }
}