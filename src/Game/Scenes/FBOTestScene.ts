import PostProcessingShaders from "@VoxelLib/assets/Shaders/PostProcessing";
import Scene from "@VoxelLib/Scene";
import SceneManager from "@VoxelLib/Scene/SceneManager";
import { VoxelSampleFunction } from "@VoxelLib/World/World";
import { vec3 } from "gl-matrix";
import REGL, { DrawCommand } from "regl";
import { createNoise2D, createNoise3D } from "simplex-noise";

export default class FBOTestScene extends Scene {
    onLoad(): void {
        this.camera.setPosition([-2, -2, 4]);
        this.camera.rotate([0, Math.PI, 0]);
        this.camera.setScale([2, 2, 2]);

        this.world.generateFromFunction([0, 0, 0], [2, 2, 2], ([x, y, z], context) => [
            (x / (context.resolution)) * 255,
            (y / (context.resolution)) * 255,
            (z / (context.resolution)) * 255,
            255
        ], 8);


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
        } else {
            this.renderer.debug.set("Camera Position", () => this.camera.getPosition());
            this.renderer.debug.set("Num Voxels", () => this.world.numVoxels);
            this.renderer.debug.set("Num Chunks", () => this.world.numChunks);
            this.renderer.debug.set("Chunk Queue", () => this.world.queue.length);
        }

        this.renderer.postProcessing.addFromSource(PostProcessingShaders.Tonemapping.ACES);
        this.renderer.postProcessing.addFromSource(PostProcessingShaders.Effects.FXAA);
        // this.renderer.postProcessing.addFromSource(PostProcessingShaders.Effects.Vignette);

        this.world.startGenerationQueue();
    }

    onFrame(ctxt: REGL.DefaultContext): void {
        // this.world.popQueue();
        this.world.render(this.camera);
    }
}