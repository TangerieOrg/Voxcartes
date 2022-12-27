import REGL, { Vec4 } from "regl";
import { Renderer } from "./lib";
import RayShader from "./lib/assets/RayShader";
import Shader from "./lib/Shader";

// const renderer = new Renderer();
const regl = REGL();


const rayShader = new Shader(regl, RayShader);

const position = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];

const testCmd = regl({
    vert: rayShader.source.Vertex,
    frag: rayShader.source.Fragment,
    attributes: {
        position
    },
    count: 6
})

const CLEAR_COLOR : Vec4 = [0, 0, 0, 1];
regl.clear({
    color: CLEAR_COLOR,
    depth: 1
});
testCmd()