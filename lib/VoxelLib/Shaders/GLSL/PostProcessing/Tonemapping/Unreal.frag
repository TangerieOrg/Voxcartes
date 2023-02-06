#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<PostProcessingUniforms>

vec3 unreal(vec3 x) {
    return x / (x + 0.155) * 1.019;
}

void main() {
    color.rgb = unreal(color.rgb);
}