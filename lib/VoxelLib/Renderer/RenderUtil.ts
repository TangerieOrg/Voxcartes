import { createShader } from "@VoxelLib/Shaders/ShaderUtil";


const PostVShader = `#version 300 es
precision highp float;

in vec2 vertex;
out vec2 uv;

void main() {
    uv =  0.5 * (vertex + 1.0);
    gl_Position = vec4(vertex, 0, 1);
}
`;

export function createPostProcessingShader(shader : string) {
    return createShader(shader, PostVShader);
}