#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<PostProcessingUniforms>
// #include<FBOUniforms>
// #include<CameraUniforms>
// #include<Common>


void main() {
    vec4 normal = texture(fbo.normal, uv);
    color.rgb = vec3(toFragDepth(normal.w, camera.zPlanes));
}