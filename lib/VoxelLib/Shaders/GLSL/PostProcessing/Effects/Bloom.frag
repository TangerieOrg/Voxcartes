#version 300 es

precision highp float;
precision highp int;

#define BLOOM_THRESHOLD 1.0

// #include<PostProcessingUniforms>

float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
    float b = luma(color.rgb);
    if(b < BLOOM_THRESHOLD) color.rgb = vec3(0);
}