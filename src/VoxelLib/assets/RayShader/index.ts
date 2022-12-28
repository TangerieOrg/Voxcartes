import Fragment from "./shader.frag";
import Vertex from "./shader.vert"
import { ShaderInitType, ShaderSource } from "../../Shader/Shader";

const source : ShaderSource = {
    Fragment,
    Vertex
}

const RayShader : ShaderInitType = {
    source
}
export default RayShader;