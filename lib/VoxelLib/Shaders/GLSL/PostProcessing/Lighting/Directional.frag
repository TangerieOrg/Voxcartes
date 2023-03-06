#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// #include<PostProcessingUniforms>
// #include<FBOUniforms>
// #include<CameraUniforms>
// #include<Common>
// #include<Lights>

vec3 calculateDirectional(vec3 normal) {
    vec3 lightDir = normalize(-sun.direction);

    float cosTheta = max(dot(normal, lightDir), 0.0);

    return sun.albedo * sun.intensity * cosTheta;
}

vec3 calculateAmbient() {
    return ambient.albedo * ambient.intensity;
}

vec3 calculateSpecular(vec3 normal, vec3 pos) {
    vec3 viewDir = normalize(camera.position - pos);
    vec3 reflectDir = reflect(normalize(-sun.direction), normal);

    float spec = pow(
        max(
            dot(viewDir, reflectDir), 0.0
        ),
        32.0
    );

    return sun.albedo * sun.specular * spec;
}

void main() {
    vec3 normal = normalize(texture(fbo.normal, uv).xyz);
    vec3 pos = texture(fbo.position, uv).xyz;

    vec3 lightColor = vec3(0);

    // Lights
    lightColor += calculateAmbient();
    lightColor += calculateDirectional(normal);
    lightColor += calculateSpecular(normal, pos);

    color.rgb *= lightColor;
}