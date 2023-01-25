struct PostProcessing {
    sampler2D albedo;
};

out vec4 color;
in vec2 uv;
uniform PostProcessing post;
