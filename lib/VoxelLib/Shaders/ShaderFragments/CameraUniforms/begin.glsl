struct Camera {
    mat4 view;
    mat4 projection;
    mat4 viewProjection;
    vec3 position;
    vec4 rotation;
    vec3 scale;
    float fov;
    vec2 zPlanes;
};

uniform Camera camera;