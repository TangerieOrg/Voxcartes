#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;

uniform sampler3D tex;

uniform vec3 cameraPosition;
uniform vec3 cameraScale;
uniform float size;
uniform vec3 offset;

in vec3 vPos;
in vec3 screenPos;
in vec3 worldPos;

layout (location = 0) out vec4 color;
layout (location = 1) out vec4 position;
layout (location = 2) out vec4 normal;

#define MAX_STEPS 100
#define VOLUME_SIZE 0.5

struct Raycast {
    vec4 result;
    vec4 position;
};

bool isCameraIn() {
    vec3 cameraPosOffset = (cameraPosition / cameraScale) - offset;
    return
    (cameraPosOffset.z < VOLUME_SIZE && cameraPosOffset.z > -VOLUME_SIZE)&&
    (cameraPosOffset.y < VOLUME_SIZE && cameraPosOffset.y > -VOLUME_SIZE)&&
    (cameraPosOffset.x < VOLUME_SIZE && cameraPosOffset.x > -VOLUME_SIZE);
}

vec4 sampleTexture(in vec3 pos) {
    if (pos.x > 1.0 || pos.y > 1.0 || pos.z > 1.0 || pos.x < 0.0 || pos.y < 0.0 || pos.z < 0.0)return vec4(0);
    return texelFetch(tex, ivec3(pos * size), 0);
}

Raycast castRay(in vec3 origin, in vec3 stepDir) {
    vec3 pos = origin;
    
    for(int i = 0; i < MAX_STEPS; i ++ ) {
        vec4 currentSample = sampleTexture(pos);
        if (currentSample.a > 0.0) {
            vec3 worldHitPos = (pos - offset) * VOLUME_SIZE;

            float distanceToHit = distance(pos, -cameraPosition / cameraScale);

            return Raycast(
                currentSample,
                vec4(worldHitPos, distanceToHit)
            );
        }
        pos += stepDir;
    }
    
    return Raycast(vec4(0), vec4(-1));
}

vec3 getOrigin() {
    if (isCameraIn()) return -cameraPosition / cameraScale + VOLUME_SIZE + offset;
    return vPos + VOLUME_SIZE;
}

void main() {
    vec3 dir = normalize(worldPos + cameraPosition);
    vec3 stepDir = dir / (sqrt(size * size * 2.));
    vec3 origin = getOrigin();
    
    Raycast castResult = castRay(origin, stepDir);

    vec3 camRelPos = castResult.position.xyz - (cameraPosition / cameraScale);
    vec3 norm = normalize(cross(
        dFdx(camRelPos),
        dFdy(camRelPos)
    ));

    normal = vec4(norm, 1.);

    if (castResult.position.x == -1.0) discard;
    color = castResult.result;
    // normal = vec4(norm, 1);
    position = castResult.position;
}