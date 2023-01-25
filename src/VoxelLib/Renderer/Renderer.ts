import { DefaultContext, DrawCommand, Regl } from "regl";
import Camera from "../Camera";
import Stats from "stats.js";
import DebugUI from "../Debug/DebugUI";
import SampleFBOShader from "@VoxelLib/assets/Shaders/FBO/SampleFBOShader";
import FullscreenQuad from "@VoxelLib/Shapes/FullscreenQuad";
import FBOManager from "./FBOManager";
import { AsContext } from "@VoxelLib/Shared/DataUtil";
import { CameraContext } from "@VoxelLib/Camera/Camera";
import { vec3 } from "gl-matrix";
import { unpackObjectToDot } from "@VoxelLib/Utility/UniformUtil";
import PostProcessingPipeline from "./PostProcessingPipeline";
import ACESTonemapping from "@VoxelLib/assets/Shaders/PostProcessing/ACES";


const stats = new Stats();
document.body.appendChild(stats.dom);

export type RenderContext = DefaultContext & AsContext<CameraContext>;

const lightPos: vec3 = vec3.create();
vec3.set(lightPos, 0, 1, 1);

export default class Renderer {
    private regl: Regl;

    private camera: Camera;

    public onFrame?: (ctxt: RenderContext) => any;

    public debug = new DebugUI();

    private renderFBO: DrawCommand;

    public fboManager: FBOManager;

    public renderContext: DrawCommand;

    public postProcessing : PostProcessingPipeline;

    constructor(regl: Regl, camera: Camera) {
        this.regl = regl;
        this.camera = camera;

        this.fboManager = new FBOManager(this.regl, [
            regl.texture({ type: 'float' }), // Color
            regl.texture({ type: 'float' }), // Normal
        ]);

        this.renderContext = regl({
            uniforms: unpackObjectToDot({
                fog: {
                    size: () => [7, 20],
                    albedo: () => [0, 0, 0]
                }
            })
        });


        const fboUniforms = unpackObjectToDot({
            fbo: {
                albedo: () => this.fboManager.get(0),
                normal: () => this.fboManager.get(1),
                resolution: () => this.fboManager.texSize
            }
        })

        // A full screen quad that renders the results of the FBO
        this.renderFBO = regl({
            frag: SampleFBOShader.Fragment,
            vert: SampleFBOShader.Vertex,
            uniforms: {
                ...fboUniforms,
                lightPos: () => lightPos
            },
            attributes: {
                vertex: FullscreenQuad.vertex
            },
            count: FullscreenQuad.count
        });


        this.postProcessing = new PostProcessingPipeline(regl);
        this.postProcessing.addFromSource(ACESTonemapping);
    }

    start() {
        this.regl.frame((ctxt) => {
            stats.begin();
            this.camera.handleInput();
            this.fboManager.resize(ctxt.viewportWidth, ctxt.viewportHeight);
            this.postProcessing.resize(ctxt.viewportWidth, ctxt.viewportHeight);

            this.camera.use(() => {
                this.renderContext(() => {
                    this.fboManager.use<RenderContext>((ctxt) => {
                        this.onFrame?.(ctxt);
                    });

                    this.postProcessing.use(() => {
                        this.renderFBO()
                    });
                });
            });


            stats.end();

            if (ctxt.tick % 30 === 0) this.debug.update();
        })
    }
}