#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D tex;

in vec2 uv;

out vec4 color;

void main() {
    color = texture(tex, uv);
}