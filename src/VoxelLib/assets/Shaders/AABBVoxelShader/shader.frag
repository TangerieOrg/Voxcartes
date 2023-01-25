#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;

uniform sampler3D tex;

uniform vec3 cameraPosition;
uniform vec3 cameraScale;
uniform int size;
uniform vec3 offset;

in vec3 vPos;
in vec3 screenPos;
in vec3 worldPos;

layout (location = 0) out vec4 color;
layout (location = 1) out vec4 position;
layout (location = 2) out vec4 normal;

#define VOLUME_SIZE 0.5

struct Raycast {
    vec4 result;
    vec3 position;
    vec3 normal;
};

bool isCameraIn() {
    vec3 cameraPosOffset = (cameraPosition / cameraScale) - offset;
    return
    (cameraPosOffset.z < VOLUME_SIZE && cameraPosOffset.z > -VOLUME_SIZE)&&
    (cameraPosOffset.y < VOLUME_SIZE && cameraPosOffset.y > -VOLUME_SIZE)&&
    (cameraPosOffset.x < VOLUME_SIZE && cameraPosOffset.x > -VOLUME_SIZE);
}

vec3 getOrigin() {
    if (isCameraIn()) return -cameraPosition / cameraScale + VOLUME_SIZE + offset;
    return vPos + VOLUME_SIZE;
}

Raycast castRay(const vec3 origin, const vec3 dir) {
    vec3 pos = floor(origin);

    vec3 stepSign = sign(dir);
    vec3 tDelta = stepSign / dir;

    float tMaxX, tMaxY, tMaxZ;

    vec3 fr = fract(origin);

    tMaxX = tDelta.x * ((dir.x>0.0) ? (1.0 - fr.x) : fr.x);
    tMaxY = tDelta.y * ((dir.y>0.0) ? (1.0 - fr.y) : fr.y);
    tMaxZ = tDelta.z * ((dir.z>0.0) ? (1.0 - fr.z) : fr.z);

    vec3 norm;
    const int maxTrace = 100;

    for (int i = 0; i < maxTrace; i++) {
        vec4 h = texelFetch(tex, ivec3(pos), 0);
        if (h.a > 0.0) {
            return Raycast(h, pos, norm);
        }

        if (tMaxX < tMaxY) {
            if (tMaxZ < tMaxX) {
                tMaxZ += tDelta.z;
                pos.z += stepSign.z;
                norm = vec3(0, 0,-stepSign.z);
            } else {
                tMaxX += tDelta.x;
            	pos.x += stepSign.x;
                norm = vec3(-stepSign.x, 0, 0);
            }
        } else {
            if (tMaxZ < tMaxY) {
                tMaxZ += tDelta.z;
                pos.z += stepSign.z;
                norm = vec3(0, 0, -stepSign.z);
            } else {
            	tMaxY += tDelta.y;
            	pos.y += stepSign.y;
                norm = vec3(0, -stepSign.y, 0);
            }
        }
    }

    return Raycast(vec4(0), vec3(-1), vec3(-1));
}


void main() {
    vec3 origin = getOrigin() * float(size);
    vec3 dir = normalize(worldPos + cameraPosition);
    Raycast res = castRay(origin, dir);

    if(res.result.a == 0.0) discard;

    normal = vec4(res.normal, 1.);
    color = vec4(res.result.xyz, 1.);
    // normal = vec4(norm, 1);
    position = vec4(1);
}