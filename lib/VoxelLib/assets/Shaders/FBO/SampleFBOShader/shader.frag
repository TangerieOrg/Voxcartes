#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<CameraUniforms>
// #include<FBOUniforms>
// #include<Common>
// #include<Lights>

in vec2 uv;

uniform DirectionalLight sun;

out vec4 color;

void main() {
    vec3 albedo = texture(fbo.albedo, uv).rgb;
    vec4 normal = texture(fbo.normal, uv);
    gl_FragDepth = toFragDepth(normal.w, camera.zPlanes);
    if(gl_FragDepth > 1.0) discard;
    
    color = vec4(albedo, 1);

    // Lighting
    color.rgb *= calculateDirectionalLight(normal.xyz, sun);
}