#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;


uniform sampler3D tex;

uniform vec3 cameraPosition;
uniform float size;
uniform vec3 offset;

in vec3 vPos;
in vec3 screenPos;
in vec3 worldPos;
out vec4 color;

#define MAX_STEPS 100
#define VOLUME_SIZE 0.5

struct Raycast {
    vec4 result;
    vec3 position;
};

bool isCameraIn() {
    vec3 cameraPosOffset = cameraPosition - offset;
    return 
    (cameraPosOffset.z < VOLUME_SIZE && cameraPosOffset.z > -VOLUME_SIZE) &&
    (cameraPosOffset.y < VOLUME_SIZE && cameraPosOffset.y > -VOLUME_SIZE) &&
    (cameraPosOffset.x < VOLUME_SIZE && cameraPosOffset.x > -VOLUME_SIZE);
}

vec4 sampleTexture(in vec3 pos) {
    if(pos.x > 1. || pos.y > 1. || pos.z > 1. || pos.x < 0. || pos.y < 0. || pos.z < 0.) return vec4(0);
    return texture(tex, pos);
}

Raycast castRay(in vec3 origin, in vec3 stepDir) {
    vec3 pos = origin;

    for(int i = 0; i < MAX_STEPS; i++) {
        vec4 currentSample = sampleTexture(pos);
        if(currentSample.a > 0.0) {
            return Raycast(
                currentSample,
                pos
            );
        }
        pos += stepDir;
    }

    return Raycast(vec4(0), vec3(-1));
}

vec3 getOrigin() {
    if(isCameraIn()) return -cameraPosition + VOLUME_SIZE + offset;
    return vPos + VOLUME_SIZE;
}

void main() {
    vec3 dir = normalize(worldPos + cameraPosition);
    vec3 stepDir = dir / size;
    vec3 origin = getOrigin();

    Raycast castResult = castRay(origin, stepDir);

    if(castResult.position.x == -1.) discard;

    color = castResult.result;
}