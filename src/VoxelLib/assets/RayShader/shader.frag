#version 300 es

precision highp float;
precision highp sampler3D;
precision highp int;

#define FOV 90.0
#define MAX_DIST 100.0
#define PI = 3.14159

struct Camera {
    vec3 position;
    vec3 rotation;
};


struct Ray {
    vec3 origin;
    vec3 dir;
};

struct Hit {
    bool didHit;
    float dist;
    vec3 col;
};

uniform float u_time;
uniform vec2 u_resolution;

uniform sampler3D diffuse;

uniform Camera camera;


out vec4 FragColor;




void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    // float fov = radians(FOV);
    // float fx = tan(fov / 2.0) / u_resolution.x;
    // vec2 d = fx * (gl_FragCoord.xy * 2.0 - u_resolution.xy);
    

    vec3 coord = vec3(uv, sin(u_time) * 0.5 + 0.5);
    vec4 col = texture(diffuse, coord);
    if(col.a == 0.) {
        discard;
    } else {
        FragColor = col;
    }
}