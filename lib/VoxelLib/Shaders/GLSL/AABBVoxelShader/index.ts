import Fragment from "./shader.frag";
import Vertex from "./shader.vert"
import { ShaderInitType, ShaderSource } from "@VoxelLib/Shaders/Shader";

const source : ShaderSource = {
    Fragment,
    Vertex
}

const AABBVoxelShader : ShaderInitType = { source };

export default AABBVoxelShader;