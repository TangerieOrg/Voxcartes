import Fragment from "./shader.frag";
import { createPostProcessingShader } from "@VoxelLib/Renderer/RenderUtil";


const CopyFBOShader = createPostProcessingShader(Fragment);

export default CopyFBOShader;