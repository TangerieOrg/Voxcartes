#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 uv;

uniform sampler2D albedoTex, positionTex;
uniform vec3 cameraPosition;
uniform vec3 lightPos;
uniform vec2 textureSize;
uniform vec3 cameraScale;

out vec4 color;

const ivec2 offset = ivec2(1, 0);

float getDepth(in ivec2 p) {
    return texelFetch(positionTex, p, 0).a;
}

vec3 getPosition(in ivec2 p) {
    return texelFetch(positionTex, p, 0).xyz;
}

vec3 calculateNormal(in ivec2 textureCoord) {
    float dzdx = (getDepth(textureCoord + offset) - getDepth(textureCoord - offset)) * 100.0;
    float dzdy = (getDepth(textureCoord + offset.yx) - getDepth(textureCoord - offset.yx)) * 100.0;

    return normalize(vec3(-dzdx, -dzdy, 1.0));
}

vec3 _calculateNormal(in ivec2 textureCoord) {
    vec3 p0 = getPosition(textureCoord);
    vec3 p1 = getPosition(textureCoord + offset.xy);
    vec3 p2 = getPosition(textureCoord + offset.yx);

    return normalize(
        cross(
            p2 - p0,
            p1 - p0
        )
    );
}

void main() {
    ivec2 textureCoord = ivec2(floor(uv * textureSize));
    // vec3 albedo = texture(albedoTex, uv).xyz;
    vec3 albedo = texelFetch(albedoTex, textureCoord, 0).rgb;
    vec4 position = texelFetch(positionTex, textureCoord, 0);
    vec3 normal = calculateNormal(textureCoord);
    
    float lightInfluence = min(1.0, max(0., dot(normal, normalize(lightPos))) + 0.5);
    if(position.a == 0.) discard;
    color = vec4(lightInfluence * albedo, 1);
}