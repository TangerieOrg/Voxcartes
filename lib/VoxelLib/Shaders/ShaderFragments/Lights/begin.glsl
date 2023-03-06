struct DirectionalLight {
    vec3 direction;
    vec3 albedo;
    float intensity;
    float specular;
};

struct AmbientLight {
    vec3 albedo;
    float intensity;
};


uniform AmbientLight ambient;
uniform DirectionalLight sun;
