#version 300 es

precision highp float;

in vec3 vPos;
in vec3 worldNormal;

out vec4 color;

void main() {
    vec3 normal = normalize(worldNormal);

    float ambient = 0.1;

    vec3 lightDir = normalize(vec3(0, 10, 10) - vPos);
    float diffuse = max(0.0, dot(lightDir, normal));
    color = vec4(min(1.0, diffuse + ambient) * vec3(255, 0, 0), 255);

    // color = vec4(normal, 255);
}