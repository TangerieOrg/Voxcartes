import Fragment from "./shader.frag";
import Vertex from "./shader.vert"
import { ShaderInitType, ShaderSource } from "@VoxelLib/Shader/Shader";

const source : ShaderSource = {
    Fragment,
    Vertex
}

const SVOShader : ShaderInitType = { source };

export default SVOShader;