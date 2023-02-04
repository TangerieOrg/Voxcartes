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
import LightingPipeline from "@VoxelLib/Lighting/LightingPipeline";


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

    public lighting : LightingPipeline;

    private config : RenderConfig;

    constructor(regl: Regl, camera: Camera, config : Partial<RenderConfig> = {}) {
        this.config = defaultsDeep({}, config, DefaultRenderConfig)

        this.regl = regl;
        this.camera = camera;

        this.fboManager = new FBOManager(this.regl, [
            regl.texture({ type: 'float' }), // Color
            regl.texture({ type: 'float' }), // Normal (& distance)
            regl.texture({ type: 'float' }), // Position
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
                    position: this.fboManager.get(2),
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

        this.lighting = new LightingPipeline(regl);
    }

    setConfig(config : RenderConfig) {
        this.config = defaultsDeep({}, config, DefaultRenderConfig);
    }

    getRenderResolution({ viewportWidth: w, viewportHeight: h } : DefaultContext, res : vec2)  {
        if(w < this.config.maxResolution) vec2.set(res, w, h);
        else vec2.set(res, this.config.maxResolution, h/w * this.config.maxResolution);
    }

    start() {
        let res : vec2 = vec2.create();
        this.regl.frame((ctxt) => {
            stats.begin();
            this.camera.handleInput();
            if(this.config.maxResolution > 0) {
                this.getRenderResolution(ctxt, res);
                this.fboManager.resize(res[0], res[1]);
            } else {
                this.fboManager.resize(ctxt.viewportWidth, ctxt.viewportHeight);
            }
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