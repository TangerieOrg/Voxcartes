import REGL, { Vec4 } from "regl";
import RayShader from "./VoxelLib/assets/RayShader";
import { createShader } from "./VoxelLib/Shader/ShaderUtil";
import Stats from "stats.js";

import compat from "./VoxelLib/compat";
import Camera from "./VoxelLib/Camera";
import BasicShader from "./VoxelLib/assets/BasicShader";

const stats = new Stats();
document.body.appendChild(stats.dom);

const regl = compat.overrideContextType(() => REGL());

// const rayShader = createShader(RayShader.source.Fragment, RayShader.source.Vertex);
// const position = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];

// const texture = (() => {
//     const SIZE = 16;
//     const MAX_VALUE = 2 ** 8;
//     const CHANNELS = 4;
//     const data = new Uint8Array(SIZE * SIZE * SIZE * CHANNELS);
//     let index : number;
//     for (let k = 0; k < SIZE; ++k) {
//         for (let j = 0; j < SIZE; ++j) {
//             for (let i = 0; i < SIZE; ++i) {
//                 index = (i + j * SIZE + k * SIZE * SIZE) * CHANNELS;
//                 data[index++] = Math.floor(i / SIZE * MAX_VALUE);
//                 data[index++] = Math.floor(j / SIZE * MAX_VALUE);
//                 data[index++] = Math.floor(k / SIZE * MAX_VALUE);
//                 data[index++] = Math.abs(
//                     (i * j * k) / (SIZE * SIZE) 
//                 ) < 0.5 ? 255:0;
//             }
//         }
//     }
//     const texture = regl.texture3D({
//         width: SIZE,
//         height: SIZE,
//         depth: SIZE,
//         data,
//         format: "rgba",
//     });
//     return texture;
// })();

// const testCmd = regl({
//     vert: rayShader.source.Vertex,
//     frag: rayShader.source.Fragment,
//     context: {
//         resolution: (context) => [context.viewportWidth, context.viewportHeight]
//     },
//     attributes: {
//         position
//     },
//     uniforms: {
//         u_time: regl.context("time"),
//         // @ts-ignore
//         u_resolution: regl.context("resolution"),
//         "camera.position": [0, 0, -5],
//         "camera.rotation": [0, 0, 0],
//         diffuse: texture
//     },
//     count: 6
// })

const position = [
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
camera.position = [0, 0, -5];
camera.updateMatrices();

const basicShader = createShader(BasicShader.source.Fragment, BasicShader.source.Vertex);

const basicCmd = regl({
    frag: basicShader.source.Fragment,
    vert: basicShader.source.Vertex,
    attributes: {
        position
    },
    elements,
    uniforms: {
        view: () => camera.viewMatrix,
        projection: () => camera.projectionMatrix
    }
})

const CLEAR_COLOR: Vec4 = [0, 0, 0, 1];

const onFrame = () => {
    // testCmd();
    basicCmd();
    camera.rotation[1] += 0.01;
    camera.updateMatrices();
}


regl.frame(() => {
    stats.begin();
    regl.clear({
        color: CLEAR_COLOR
    });
    onFrame();
    stats.end();
})