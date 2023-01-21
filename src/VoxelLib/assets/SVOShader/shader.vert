#version 300 es

precision highp float;
precision highp int;

in vec3 vertex;
out vec3 vPos;
out vec3 screenPos;
out vec3 worldPos;

uniform mat4 viewProjection;
uniform mat4 model;
uniform vec3 cameraScale;

void main() {
    vPos = vertex;
    vec4 modelVertex = model * vec4(vertex, 1);
    worldPos = modelVertex.xyz * cameraScale;
    gl_Position = viewProjection * modelVertex;
    screenPos = gl_Position.xyz;
}