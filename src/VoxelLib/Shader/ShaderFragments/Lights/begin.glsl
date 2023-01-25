struct DirectionalLight {
    vec3 direction;
    vec3 albedo;
    float intensity;
};

vec3 calculateDirectionalLight(const vec3 normal, const DirectionalLight light) {
    float lightInfluence = clamp(
        dot(normal.xyz, normalize(-light.direction))
        , 0.0, 2.0
    ) + 0.4;
    // TODO: Add ambient light parameters

    return light.albedo * light.intensity * lightInfluence;
}