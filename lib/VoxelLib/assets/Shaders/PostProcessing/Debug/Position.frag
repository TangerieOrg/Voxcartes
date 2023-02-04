#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<PostProcessingUniforms>
// #include<FBOUniforms>
// #include<CameraUniforms>
// #include<Common>


void main() {
    vec4 pos = texture(fbo.position, uv);
    color.rgb = pos.rgb;
}