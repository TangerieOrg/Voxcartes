#version 300 es

precision highp float;
precision highp int;

// #include<CameraUniforms>

in vec3 vertex;
out vec3 vPos;
out vec3 screenPos;
out vec3 worldPos;

uniform mat4 model;

void main() {
    vPos = vertex;
    vec4 modelVertex = model * vec4(vertex, 1);
    worldPos = modelVertex.xyz * camera.scale;
    gl_Position = camera.viewProjection * modelVertex;
    screenPos = gl_Position.xyz;
}