import { createPostProcessingShader } from "@VoxelLib/Renderer/RenderUtil";
import PostProcessingShaders from "./**/*.frag";
import preval from 'preval.macro'

// https://github.com/dmnsgn/glsl-tone-map

function recursivelyCreate(obj : Record<string, any>) {
    for(const [key, value] of Object.entries(obj)) {
        if(typeof value === "string") {
            obj[key] = createPostProcessingShader(value);
        } else recursivelyCreate(value)
    }
}

recursivelyCreate(PostProcessingShaders);

export default PostProcessingShaders;