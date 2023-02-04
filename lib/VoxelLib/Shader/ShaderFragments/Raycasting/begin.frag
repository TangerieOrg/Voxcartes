
uniform sampler3D tex;

uniform int size;
uniform vec3 offset;
uniform int lod;

in vec3 vPos;
in vec3 screenPos;
in vec3 worldPos;

#define VOLUME_SIZE 0.5

struct Raycast {
    vec4 result;
    vec3 position;
    vec3 normal;
};

bool isCameraIn() {
    vec3 cameraPosOffset = (camera.position / camera.scale) - offset;
    return
    (cameraPosOffset.z < VOLUME_SIZE && cameraPosOffset.z > -VOLUME_SIZE)&&
    (cameraPosOffset.y < VOLUME_SIZE && cameraPosOffset.y > -VOLUME_SIZE)&&
    (cameraPosOffset.x < VOLUME_SIZE && cameraPosOffset.x > -VOLUME_SIZE);
}

vec3 getOrigin() {
    if (isCameraIn()) return -camera.position / camera.scale + VOLUME_SIZE + offset;
    return vPos + VOLUME_SIZE;
}

vec3 cubenormal(vec3 v) {
    vec3 s = sign(v);
    vec3 a = abs(v);

    vec3 n = mix(
        mix(vec3(0.0, 0.0, s.z), vec3(s.x, 0.0, 0.0), step(a.z, a.x)),
        mix(vec3(0.0, s.y, 0.0), vec3(s.x, 0.0, 0.0), step(a.y, a.x)),
        step(a.z, a.y));

    return n;
}

Raycast castRay(const vec3 origin, const vec3 dir) {
    vec3 pos = floor(origin);

    vec3 stepSign = sign(dir);
    vec3 tDelta = stepSign / dir;

    float tMaxX, tMaxY, tMaxZ;

    vec3 fr = fract(origin);

    float lodMult = 1.0 / pow(2.0, float(lod));

    tMaxX = tDelta.x * ((dir.x>0.0) ? (1.0 - fr.x) : fr.x);
    tMaxY = tDelta.y * ((dir.y>0.0) ? (1.0 - fr.y) : fr.y);
    tMaxZ = tDelta.z * ((dir.z>0.0) ? (1.0 - fr.z) : fr.z);

    vec3 norm = cubenormal(origin - float(size) * 0.5);
    const int maxTrace = 89;

    for (int i = 0; i < maxTrace; i++) {
        if(pos.x < 0.0 || pos.y < 0.0 || pos.z < 0.0 || pos.x > float(size) || pos.y > float(size) || pos.z > float(size)) {
            return Raycast(vec4(0), vec3(-1), vec3(-1));
        }
        vec4 h = texelFetch(tex, ivec3(pos * lodMult), lod);
        
        if (h.a > 0.0) return Raycast(h, pos, norm);

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
