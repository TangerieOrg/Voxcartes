struct Fog {
    vec2 size;
    vec3 albedo;
};

uniform Fog fog;

vec3 calculateColorWithFog(in vec3 color, float d) {
    float fogAmount = smoothstep(fog.size.x, fog.size.y, d);
    return mix(color, fog.albedo, fogAmount);
}