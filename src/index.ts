import REGL, { DefaultContext, Texture3D, Vec4 } from "regl";
import RayShader from "./VoxelLib/assets/RayShader";
import { createShader } from "./VoxelLib/Shader/ShaderUtil";
import Stats from "stats.js";

import { createNoise3D, createNoise4D } from 'simplex-noise';

import compat from "./VoxelLib/compat";
import Camera from "./VoxelLib/Camera";
import BasicShader from "./VoxelLib/assets/BasicShader";
import { mat4, quat, vec3 } from "gl-matrix";
import ObjectTransform from "./VoxelLib/Shared/Object";

const stats = new Stats();
document.body.appendChild(stats.dom);

const regl = compat.overrideContextType(() => REGL());


const noise = createNoise4D();
const SIZE = 32;
const CHANNELS = 4;

const NOISE_SCALE = 50;
const MAX_VALUE = 2 ** 8 - 1;

const updateData = (data : Uint8Array = new Uint8Array(SIZE * SIZE * SIZE * CHANNELS), offset : vec3 = [0, 0, 0],t=0) => {
    let index: number;
    for (let z = 0; z < SIZE; ++z) {
        for (let y = 0; y < SIZE; ++y) {
            for (let x = 0; x < SIZE; ++x) {
                index = (x + y * SIZE + z * SIZE * SIZE) * CHANNELS;
                const noiseVal = noise(
                    (z + offset[0]) / NOISE_SCALE, 
                    (y + offset[1]) / NOISE_SCALE, 
                    (x + offset[2]) / NOISE_SCALE,
                    t / NOISE_SCALE
                ) * 0.5 + 0.5;

                const rVal = noise(
                    (z + offset[0]) / NOISE_SCALE + 100, 
                    (y + offset[1]) / NOISE_SCALE, 
                    (x + offset[2]) / NOISE_SCALE,
                    t / NOISE_SCALE
                ) * 0.5 + 0.5;

                const gVal = noise(
                    (z + offset[0]) / NOISE_SCALE, 
                    (y + offset[1]) / NOISE_SCALE + 100, 
                    (x + offset[2]) / NOISE_SCALE,
                    t / NOISE_SCALE
                ) * 0.5 + 0.5;

                const bVal = noise(
                    (z + offset[0]) / NOISE_SCALE, 
                    (y + offset[1]) / NOISE_SCALE, 
                    (x + offset[2]) / NOISE_SCALE + 100,
                    t / NOISE_SCALE
                ) * 0.5 + 0.5;

                data[index++] = rVal * MAX_VALUE;//Math.floor(i / SIZE * MAX_VALUE);
                data[index++] = gVal * MAX_VALUE;
                data[index++] = bVal * MAX_VALUE;
                data[index++] = Math.round(noiseVal) * MAX_VALUE;
            }
        }
    }
    return data;
}

const createTexture = (data : Uint8Array = new Uint8Array(SIZE * SIZE * SIZE * CHANNELS)) => {
    const texture = regl.texture3D({
        width: SIZE,
        height: SIZE,
        depth: SIZE,
        data,
        format: "rgba",
    });
    return texture;
}


const vertex = [
    [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // positive z face.
    [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // positive x face
    [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // negative z face
    [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // negative x face.
    [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top face
    [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5]  // bottom face
];

const elements = [
    [2, 1, 0], [2, 0, 3],       // positive z face.
    [6, 5, 4], [6, 4, 7],       // positive x face.
    [10, 9, 8], [10, 8, 11],    // negative z face.
    [14, 13, 12], [14, 12, 15], // negative x face.
    [18, 17, 16], [18, 16, 19], // top face.
    [20, 21, 22], [23, 20, 22]  // bottom face
]


const camera = new Camera(regl);
camera.position = [0, 0, -3];
camera.updateMatrices();

const basicShader = createShader(BasicShader.source.Fragment, BasicShader.source.Vertex);

const numPerSize = 8;


const transforms : ObjectTransform[] = [];
const datas : Uint8Array[] = [];
const textures : Texture3D[] = [];
// const positions : vec3[] = [];

for(let x = 0; x < numPerSize; x++) {
    for(let y = 0; y < numPerSize; y++) {
        for(let z = 0; z < numPerSize; z++) {
            const t = new ObjectTransform();
            t.setPosition([x, y , z]);
            
            const d = updateData(undefined, [-z * SIZE, -y * SIZE, -x * SIZE]);
            const tex = createTexture(d);
            transforms.push(t);
            datas.push(d);
            textures.push(tex);
        }
    }
}


const basicCmd = regl({
    frag: basicShader.source.Fragment,
    vert: basicShader.source.Vertex,
    attributes: {
        vertex
    },
    elements,
    uniforms: {
        view: (ctx) => ctx.view,
        projection: (ctx) => ctx.projection,
        viewProjection: (ctx) => ctx.viewProjection,
        cameraPosition: (ctx) => ctx.cameraPosition,
        // @ts-ignore
        tex: regl.prop("tex"),
        // @ts-ignore
        model: regl.prop("model"),
        // @ts-ignore
        size: regl.prop("size"),
        // @ts-ignore
        offset: regl.prop("offset")
    },
    context: {
        ...camera.createContext()
    }
});



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

const batch = transforms.map((t, i) => ({
    tex: textures[i],
    model: t.worldMatrix,
    size: 32,
    offset: t.position
}));

const onFrame = (ctxt : DefaultContext) => {
    basicCmd(batch);

    if(ctxt.tick % 30 === 0) {
        document.getElementById("debug-camera-position")!.innerText = `${camera.position[0]} ${camera.position[1]} ${camera.position[2]}`
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