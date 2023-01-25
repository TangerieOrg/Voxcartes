import Fragment from "./shader.frag";
import { createPostProcessingShader } from "@VoxelLib/Renderer/RenderUtil";


const ACESTonemapping = createPostProcessingShader(Fragment);
export default ACESTonemapping;