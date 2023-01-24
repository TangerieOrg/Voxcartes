#version 300 es

precision highp float;

in vec2 vertex;
out vec2 uv;

void main() {
    uv =  0.5 * (vertex + 1.0);
    gl_Position = vec4(vertex, 0, 1);
}