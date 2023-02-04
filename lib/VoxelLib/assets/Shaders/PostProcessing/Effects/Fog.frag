#version 300 es

precision highp float;
precision highp sampler2D;

// #include<PostProcessingUniforms>
// #include<FBOUniforms>
// #include<Common>

struct Fog {
    vec2 size;
    vec3 albedo;
};

uniform Fog fog;

void main() {
    float d = texture(fbo.normal, uv).w;
    float fogAmount = smoothstep(fog.size.x, fog.size.y, d);
    color.rgb = mix(color.rgb, fog.albedo, fogAmount);
}