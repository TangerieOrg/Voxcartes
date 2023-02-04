#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<CameraUniforms>
// #include<FBOUniforms>
// #include<Common>

out vec4 color;
in vec2 uv;

void main() {
    vec4 normal = texture(fbo.normal, uv);
    color.rgb = normal.rgb * 0.5 + 0.5;
}