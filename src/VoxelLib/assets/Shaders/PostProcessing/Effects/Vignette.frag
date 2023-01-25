#version 300 es

precision highp float;
precision highp int;

// #include<PostProcessingUniforms>

const float falloff = 0.45;
const float amount = 0.4;

void main() {
    float d = distance(uv, vec2(0.5, 0.5));
    color.rgb *= smoothstep(0.8, falloff * 0.799, d * (amount + falloff));
}