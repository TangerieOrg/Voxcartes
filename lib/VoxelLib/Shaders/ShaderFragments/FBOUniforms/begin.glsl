struct FBO {
    vec2 resolution;
    sampler2D albedo, normal, position;
};

uniform FBO fbo;