#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<CameraUniforms>
// #include<Fog>
// #include<FBOUniforms>

in vec2 uv;

uniform vec3 lightPos;

out vec4 color;

void main() {
    ivec2 textureCoord = ivec2(round(uv * fbo.resolution));
    vec3 albedo = texelFetch(fbo.albedo, textureCoord, 0).rgb;
    vec4 normal = texelFetch(fbo.normal, textureCoord, 0);
    
    // Lighting
    
    float lightInfluence = dot(normal.xyz, normalize(lightPos)) + 0.5;
    
    color = vec4(albedo * lightInfluence, 1);
    
    // Fog
    
    float fogAmount = smoothstep(fog.size.x, fog.size.y, normal.w);
    color.rgb = mix(color.rgb, fog.albedo, fogAmount);
}