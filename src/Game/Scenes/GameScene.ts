import REGL from "regl";
import { createNoise2D } from 'simplex-noise';
import { VoxelSampleFunction } from "@VoxelLib/World/World";
import Scene from "@VoxelLib/Scene";

export default class GameScene extends Scene {
    onLoad(): void {
        this.camera.setPosition([0, 0, 8]);
        this.camera.rotate([0, Math.PI, 0]);
        this.camera.setScale([4, 4, 4]);

        const NOISE_SCALE = 100;

        const noise2d = createNoise2D();
        const voxSample : VoxelSampleFunction = ([x, y, z], context) => {
            const floorHeight = Math.pow((noise2d(x / NOISE_SCALE, z / NOISE_SCALE ) * 0.5 + 0.5), 2) * context.resolution;
            
            return [
                (x / (context.resolution * 16)) * 255, 
                (y / (context.resolution * 2)) * 255, 
                (z / (context.resolution * 16)) * 255, 
                (y - context.resolution) < floorHeight ? 255 : 0
            ]
        }
        const floorSample : VoxelSampleFunction = ([x, y, z], context) => {
            return [
                (x / (context.resolution * 16)) * 255, 
                (y / (context.resolution * 2)) * 255, 
                (z / (context.resolution * 16)) * 255, 
                255
            ]
        }


        this.world.createGenerationQueue([0, 1, 0], [16, 2, 16], voxSample, 32);

        // this.world.generateFromFunction([0, 0, 0], [3, 1, 1], ([x, y, z], context) => [
        //     (x / (context.resolution)) * 255, 
        //     (y / (context.resolution)) * 255, 
        //     (z / (context.resolution)) * 255, 
        //     255
        // ], 32);

        this.world.generateFromFunction([0,0,0], [16,1,16], floorSample, 8);

        // console.log(world.getChunk([0, 0, 0])?.neighbourObscureFlag)
        // console.log(world.getChunk([1, 0, 0])?.neighbourObscureFlag)
        // console.log(world.getChunk([2, 0, 0])?.neighbourObscureFlag)

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