import REGL from "regl";
import { createNoise2D } from 'simplex-noise';
import compat from "./VoxelLib/compat";
import Camera from "./VoxelLib/Camera";
import World, { VoxelSampleFunction } from "./VoxelLib/World/World";
import DebugUI from "./VoxelLib/Debug/DebugUI";
import Renderer from "./VoxelLib/Renderer";



const regl = compat.overrideContextType(() => REGL());

const camera = new Camera(regl);
camera.position = [-4, -3, 8];
camera.rotate([0, Math.PI, 0]);
camera.updateMatrices();

const renderer = new Renderer(regl, camera);

const world = new World(regl);



const NOISE_SCALE = 100;

const noise2d = createNoise2D();
const floorOffset = 0;
const RESOLUTION = 32;
const FLOOR_RESOLUTION = 16;
const voxSample : VoxelSampleFunction = ([x, y, z]) => {
    
    const floorHeight = (noise2d(x / NOISE_SCALE, z / NOISE_SCALE ) * 0.5 + 0.5) * RESOLUTION;
    
    return [
        (x / (RESOLUTION * 16)) * 255, 
        (y / (RESOLUTION * 2)) * 255, 
        (z / (RESOLUTION * 16)) * 255, 
        (y - RESOLUTION) < floorHeight ? 255 : 0
    ]
}
const floorSample : VoxelSampleFunction = ([x, y, z]) => {
    return [
        (x / (FLOOR_RESOLUTION * 16)) * 255, 
        (y / (FLOOR_RESOLUTION * 2)) * 255, 
        (z / (FLOOR_RESOLUTION * 16)) * 255, 
        255
    ]
}


world.createGenerationQueue([0, 1, 0], [16, 2, 16], voxSample, RESOLUTION);

renderer.debug.set("Camera Position", () => camera.position);
renderer.debug.set("Num Voxels", () => world.numVoxels);
renderer.debug.set("Chunk Queue", () => world.queue.length);

renderer.onFrame = (ctxt) => {
    world.popQueue();
    world.render();
}

renderer.start();

// world.generateFromFunction([0, 0, 0], [8, 3, 8], voxSample);
world.generateFromFunction([0, 0, 0], [16, 1, 16], floorSample, FLOOR_RESOLUTION);