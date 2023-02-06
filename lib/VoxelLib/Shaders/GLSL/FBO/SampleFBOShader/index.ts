import Fragment from "./shader.frag";
import { createPostProcessingShader } from "@VoxelLib/Renderer/RenderUtil";


const SampleFBOShader = createPostProcessingShader(Fragment);

export default SampleFBOShader;