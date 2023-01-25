#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;

// #include<CameraUniforms>
// #include<Raycasting>

layout (location = 0) out vec4 color;
layout (location = 1) out vec4 normal;


void main() {
    vec3 origin = getOrigin() * float(size);

    if(distance(worldPos, -camera.position) > camera.zPlanes.y) discard;

    vec3 dir = normalize(worldPos + camera.position);
    Raycast res = castRay(origin, dir);

    if(res.result.a == 0.0) discard;
    vec3 position = ((res.position / float(size)) - offset) * VOLUME_SIZE;
    normal = vec4(
        normalize(res.normal), 
        distance(-camera.position / camera.scale, position)
    );
    color = vec4(res.result.xyz, 1.);
}