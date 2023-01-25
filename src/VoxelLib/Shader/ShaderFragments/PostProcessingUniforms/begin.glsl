struct PostProcessing {
    sampler2D albedo;
    vec2 resolution;
};

out vec4 color;
in vec2 uv;
uniform PostProcessing post;
