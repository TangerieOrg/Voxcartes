import REGL, { DefaultContext, Vec4 } from "regl";
import Stats from "stats.js";

import { createNoise2D } from 'simplex-noise';

import compat from "./VoxelLib/compat";
import Camera from "./VoxelLib/Camera";
import { mat4, quat, vec3 } from "gl-matrix";
import World, { VoxelSampleFunction } from "./VoxelLib/World/World";
import { CHUNK_SIZE } from "./VoxelLib/World/contants";
import { createShader } from "./VoxelLib/Shader/ShaderUtil";
import BasicShader from "./VoxelLib/assets/BasicShader";
import CubeDefinition from "./VoxelLib/Shapes/Cube";
import ObjectTransform from "./VoxelLib/Shared/Object";
import DebugUI from "./VoxelLib/Debug/DebugUI";

const stats = new Stats();
document.body.appendChild(stats.dom);

const regl = compat.overrideContextType(() => REGL());

const debug = new DebugUI();

const camera = new Camera(regl);
camera.position = [-4, -3, 8];
camera.updateMatrices();
camera.rotate([0, Math.PI, 0]);

const cameraCommand = regl({
    context: camera.createContext(),
    uniforms: {
        view: (ctx) => ctx.view,
        projection: (ctx) => ctx.projection,
        viewProjection: (ctx) => ctx.viewProjection,
        cameraPosition: (ctx) => ctx.cameraPosition
    }
})


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


const CLEAR_COLOR: Vec4 = [0.1, 0.1, 0.1, 1];

const handleCameraInput = (() => {
    const activeKeys: string[] = [];

    window.addEventListener("keydown", ev => {
        if (ev.defaultPrevented) return;
        ev.preventDefault()

        if (!activeKeys.includes(ev.key)) activeKeys.push(ev.key);
    })

    window.addEventListener('keyup', ev => {
        if (ev.defaultPrevented) return;
        ev.preventDefault()
        activeKeys.splice(activeKeys.indexOf(ev.key), 1);
    })


    let isDirty = false;
    const moveSpeed = 0.08;
    const turnSpeed = 0.02;
    return () => {
        const dir: vec3 = [0, 0, 0];

        if (activeKeys.includes("w")) {
            dir[2] = moveSpeed;
            isDirty = true;
        } else if (activeKeys.includes("s")) {
            dir[2] = -moveSpeed;
            isDirty = true;
        }

        if (activeKeys.includes("a")) {
            dir[0] = moveSpeed;
            isDirty = true;
        } else if (activeKeys.includes("d")) {
            dir[0] = -moveSpeed;
            isDirty = true;
        }

        if (activeKeys.includes(" ")) {
            dir[1] = -moveSpeed;
            isDirty = true;
        } else if (activeKeys.includes("Shift")) {
            dir[1] = moveSpeed;
            isDirty = true;
        }

        if (activeKeys.includes("q")) {
            quat.rotateY(camera.rotation, camera.rotation, turnSpeed);
            isDirty = true;
        } else if (activeKeys.includes("e")) {
            quat.rotateY(camera.rotation, camera.rotation, -turnSpeed);
            isDirty = true;
        }

        if (isDirty) {
            const cam = mat4.copy(mat4.create(), camera.rotationMatrix);
            vec3.transformMat4(dir, dir, cam);
            vec3.add(camera.position, camera.position, dir);
            camera.updateMatrices();
            isDirty = false;
        }
    }
})()


const basicShader = createShader(BasicShader.source.Fragment, BasicShader.source.Vertex);

const testCubeCmd = regl({
    frag: basicShader.source.Fragment,
    vert: basicShader.source.Vertex,
    attributes: {
        vertex: CubeDefinition.vertex,
        normal: CubeDefinition.normals
    },
    elements: CubeDefinition.elements,
    uniforms: {
        model: regl.prop<{ model: mat4}>("model")
    }
})

const cubeTransform = new ObjectTransform();

const topQueue = world.createGenerationQueue([0, 1, 0], [16, 2, 16], voxSample, RESOLUTION);



const onFrame = (ctxt : DefaultContext) => {
    if(topQueue.length > 0) topQueue.pop()?.();
    cameraCommand({}, () => {
        world.render();
    })

    if(ctxt.tick % 30 === 0) {
        debug.set("Camera Position", camera.position);
        debug.set("Num Voxels", world.chunks.size * RESOLUTION * RESOLUTION * RESOLUTION);
    }

    handleCameraInput();
}



regl.frame((ctxt) => {
    stats.begin();
    regl.clear({
        color: CLEAR_COLOR
    });
    onFrame(ctxt);
    stats.end();
})

// world.generateFromFunction([0, 0, 0], [8, 3, 8], voxSample);
world.generateFromFunction([0, 0, 0], [16, 1, 16], floorSample, FLOOR_RESOLUTION);