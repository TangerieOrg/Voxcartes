#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<PostProcessingUniforms>

const float a = 2.51;
const float b = 0.03;
const float c = 2.43;
const float d = 0.59;
const float e = 0.14;

vec3 aces(vec3 x) {
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    color.rgb = aces(color.rgb);
}