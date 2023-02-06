#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<PostProcessingUniforms>
// #include<FBOUniforms>
// #include<CameraUniforms>
// #include<Common>
// #include<Lights>


void main() {
    vec4 normal = texture(fbo.normal, uv);
    float lightInfluence = clamp(
        dot(normal.xyz, normalize(-sun.direction))
        , 0.0, 2.0
    ) + 0.4;

    color.rgb *= sun.albedo * sun.intensity * lightInfluence;
}