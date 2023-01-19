#version 300 es

precision highp float;

in vec3 vertex;
in vec3 normal;
out vec3 vNormal;
out vec3 vPos;
out vec3 worldNormal;

uniform mat4 viewProjection;
uniform mat4 model;

void main() {
    // Change to use translation
    vPos = vertex;
    vNormal = normal;
    vec4 modelVertex = model * vec4(vertex, 1);
    worldNormal = (model * vec4(normal, 1)).xyz;
    gl_Position = viewProjection * modelVertex;
}