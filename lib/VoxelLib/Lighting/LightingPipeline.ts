import LightDirectionalShader from "@VoxelLib/assets/Shaders/Lighting/DirectionalShader";
import FullscreenQuad from "@VoxelLib/Shapes/FullscreenQuad";
import { DrawCommand, Framebuffer2D, Regl, Texture2D } from "regl";

export default class LightingPipeline {
    private regl: Regl;

    private readonly lightTexture : Texture2D;
    private readonly lightFbo : Framebuffer2D;

    private drawDirectional : DrawCommand;

    constructor(regl : Regl) {
        this.regl = regl;

        this.lightTexture = this.regl.texture({ type : 'float'});
        this.lightFbo = this.regl.framebuffer({
            color: this.lightTexture
        });

        this.drawDirectional = this.regl({
            frag: LightDirectionalShader.Fragment,
            vert: LightDirectionalShader.Vertex,
            attributes: {
                vertex: FullscreenQuad.vertex
            },
            count: FullscreenQuad.count
        });
    }

    draw() {
        
    }
}