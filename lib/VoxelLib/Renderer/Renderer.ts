import { DefaultContext, DrawCommand, Regl } from "regl";
import Camera from "../Camera";
import Stats from "stats.js";
import DebugUI from "../Debug/DebugUI";
import SampleFBOShader from "@VoxelLib/assets/Shaders/FBO/SampleFBOShader";
import FullscreenQuad from "@VoxelLib/Shapes/FullscreenQuad";
import FBOManager from "./FBOManager";
import { AsContext } from "@VoxelLib/Shared/DataUtil";
import { CameraContext } from "@VoxelLib/Camera/Camera";
import { vec2, vec3 } from "gl-matrix";
import { unpackObjectToDot } from "@VoxelLib/Utility/UniformUtil";
import PostProcessingPipeline from "./PostProcessingPipeline";
import { defaultsDeep } from "lodash";


const stats = new Stats();
document.body.appendChild(stats.dom);

export interface RenderConfig {
    maxResolution: number;
}

const DefaultRenderConfig : RenderConfig = {
    maxResolution: 1080
}

export type RenderContext = DefaultContext & AsContext<CameraContext>;

const lightPos: vec3 = vec3.create();
vec3.set(lightPos, 0, -1, 1);

export default class Renderer {
    private regl: Regl;

    private camera: Camera;

    public onFrame?: (ctxt: RenderContext) => any;

    public debug = new DebugUI();

    public renderFBO: DrawCommand;

    public fboManager: FBOManager;

    public renderContext: DrawCommand;

    public postProcessing : PostProcessingPipeline;

    private config : RenderConfig;

    constructor(regl: Regl, camera: Camera, config : Partial<RenderConfig> = {}) {
        this.config = defaultsDeep({}, config, DefaultRenderConfig)

        this.regl = regl;
        this.camera = camera;

        this.fboManager = new FBOManager(this.regl, [
            regl.texture({ type: 'float' }), // Color
            regl.texture({ type: 'float' }), // Normal (& distance)
        ]);

        this.renderContext = regl({
            uniforms: unpackObjectToDot({
                fog: {
                    size: [5, 12],
                    albedo: [0, 0, 0]
                },
                fbo: {
                    albedo: this.fboManager.get(0),
                    normal: this.fboManager.get(1),
                    resolution: () => this.fboManager.texSize
                },
                sun: {
                    direction: () => lightPos,
                    albedo: [1, 1, 1],
                    intensity: 1
                }
            })
        });

        // A full screen quad that renders the results of the FBO
        this.renderFBO = regl({
            frag: SampleFBOShader.Fragment,
            vert: SampleFBOShader.Vertex,
            attributes: {
                vertex: FullscreenQuad.vertex
            },
            count: FullscreenQuad.count
        });


        this.postProcessing = new PostProcessingPipeline(regl);
    }

    setConfig(config : RenderConfig) {
        this.config = defaultsDeep({}, config, DefaultRenderConfig);
    }

    getRenderResolution({ viewportWidth: w, viewportHeight: h } : DefaultContext) : vec2 {
        const aspect = w / h;
        const maxW = this.config.maxResolution;
        const maxH = this.config.maxResolution;
        // If less
        if(w < maxW && h < maxH) return [w, h];


        if(h > w) return [maxW, w / aspect];
        else return [h / aspect, maxH];
    }

    start() {
        let res;
        this.regl.frame((ctxt) => {
            res = this.getRenderResolution(ctxt);
            stats.begin();
            this.camera.handleInput();
            this.fboManager.resize(res[0], res[1]);
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