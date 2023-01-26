import REGL, { CommandStats, DrawCommand } from "regl";
import { createNoise2D, createNoise3D } from 'simplex-noise';
import { VoxelSampleFunction } from "@VoxelLib/World/World";
import Scene from "@VoxelLib/Scene";
import PostProcessingShaders from "@VoxelLib/assets/Shaders/PostProcessing";
import SceneManager from "@VoxelLib/Scene/SceneManager";
import { vec3 } from "gl-matrix";

export default class GameScene extends Scene {
    onLoad(): void {
        this.camera.setPosition([-8, -8, 8]);
        this.camera.rotate([0, Math.PI, 0]);
        this.camera.setScale([2, 2, 2]);

        const NOISE_SCALE = 0.5;

        const noise2d = createNoise2D();
        const noise3d = createNoise3D();
        const voxSample : VoxelSampleFunction = ([x, y, z], context) => {
            const floorHeight = Math.pow((noise2d(x / NOISE_SCALE, z / NOISE_SCALE ) * 0.5 + 0.5), 2) * context.resolution * 1.5;
            
            return [
                (x / (context.resolution * 16)) * 255, 
                (y / (context.resolution * 3)) * 255, 
                (z / (context.resolution * 16)) * 255, 
                (y - context.resolution) < floorHeight ? 255 : 0
            ]
        }
        const floorSample : VoxelSampleFunction = ([x, y, z], context) => {
            return [
                (x / (context.resolution * 16)) * 255, 
                (y / (context.resolution * 3)) * 255, 
                (z / (context.resolution * 16)) * 255, 
                255
            ]
        }

        const holeSample : VoxelSampleFunction = ([x, y, z], context) => {
            const s = noise3d(x / NOISE_SCALE, y / NOISE_SCALE, z / NOISE_SCALE) * 0.5 + 0.5;
            return [
                (x / (context.resolution * 12)) * 255, 
                (y / (context.resolution * 8)) * 255, 
                (z / (context.resolution * 12)) * 255,
                s > 0.5 ? 255 : 0
            ]
        }

        const RADIUS = 100;
        const CENTER = vec3.fromValues(32 * 4, 32 * 4, 32 * 4);
        const sphereSample : VoxelSampleFunction = ([x, y, z], context) => {
            const distance = vec3.distance(CENTER, [x, y, z]);
            const s = noise3d(x / NOISE_SCALE / distance, y / NOISE_SCALE / distance, z / NOISE_SCALE / distance) * 0.5 + 0.5;
            return [
                x / (context.resolution * 8) * 255,
                y / (context.resolution * 8) * 255,
                z / (context.resolution * 8) * 255,
                distance < RADIUS && s > 0.5 ? 255 : 0
            ]
        };

        // this.world.createGenerationQueue([0, 0, 0], [12, 8, 12], holeSample, 32);

        // this.world.createGenerationQueue([0, 1, 0], [16, 3, 16], voxSample, 32);

        // this.world.generateFromFunction([0,0,0], [16,1,16], floorSample, 8);

        this.world.createGenerationQueue([0, 0, 0], [8, 8, 8], sphereSample, 32);

        // this.renderer.debug.set("Camera Position", () => this.camera.getPosition());
        // this.renderer.debug.set("Num Voxels", () => this.world.numVoxels);
        // this.renderer.debug.set("Num Chunks", () => this.world.numChunks);
        // this.renderer.debug.set("Chunk Queue", () => this.world.queue.length);

        const cmds : [string, DrawCommand][] = [
            ["Chunk", this.world.cmd],
            ["Lighting", this.renderer.renderFBO],
            ["PostProcessing", this.renderer.postProcessing.drawEffect]
        ];

        if(SceneManager.isDebug) {
            for(const [name, cmd] of cmds) {
                this.renderer.debug.trackDifference(`[${name}] GPU`, () => cmd.stats.gpuTime, "ms/frame");
                this.renderer.debug.trackDifference(`[${name}] CPU`, () => cmd.stats.cpuTime, "ms/frame");
                this.renderer.debug.trackDifference(`[${name}] Count`, () => cmd.stats.count, "call/frame");
            }
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