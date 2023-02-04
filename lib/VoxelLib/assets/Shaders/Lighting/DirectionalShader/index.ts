import Fragment from "./shader.frag";
import { createPostProcessingShader } from "@VoxelLib/Renderer/RenderUtil";


const LightDirectionalShader = createPostProcessingShader(Fragment);

export default LightDirectionalShader;