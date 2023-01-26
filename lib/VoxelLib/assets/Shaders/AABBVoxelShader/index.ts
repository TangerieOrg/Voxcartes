import Fragment from "./shader.frag";
import Vertex from "./shader.vert"
import { ShaderInitType, ShaderSource } from "@VoxelLib/Shader/Shader";

const source : ShaderSource = {
    Fragment,
    Vertex
}

const AABBVoxelShader : ShaderInitType = { source };

export default AABBVoxelShader;