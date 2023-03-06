import { DefaultContext, DrawCommand, Regl } from "regl";
import Camera from "../Camera";
import Stats from "stats.js";
import DebugUI from "../Debug/DebugUI";
import SampleFBOShader from "@VoxelLib/Shaders/GLSL/FBO/SampleFBOShader";
import FullscreenQuad from "@VoxelLib/Shapes/FullscreenQuad";
import FBOManager from "./FBOManager";
import { AsContext } from "@VoxelLib/Shared/DataUtil";
import { CameraContext } from "@VoxelLib/Camera/Camera";
import { vec2, vec3 } from "gl-matrix";
import { unpackObjectToDot } from "@VoxelLib/Utility/UniformUtil";
import PostProcessingPipeline from "./PostProcessingPipeline";
import { defaultsDeep } from "lodash";
import SceneManager from "@VoxelLib/Scene/SceneManager";


const stats = new Stats();
// @ts-ignore
if(process.env.NODE_ENV === 'development') {
    document.body.appendChild(stats.dom);
}

export interface RenderConfig {
    maxResolution: number;
}

const DefaultRenderConfig : RenderConfig = {
    maxResolution: 1920
}

export type RenderContext = DefaultContext & AsContext<CameraContext>;

const lightPos: vec3 = vec3.fromValues(0, -1, -1);

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

    public frameTime : number = 0; 

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
                    size: [10, 25],
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
        let func = (ctxt : DefaultContext) => {
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
                        this.renderFBO();
                    });
                });
            });



            if (this.debug.visible && ctxt.tick % 30 === 0) this.debug.update();
        }

        if(SceneManager.isDebug) {
            const _func = func;
            let start;
            func = (ctxt : DefaultContext) => {
                stats.begin();
                start = performance.now()
                _func(ctxt);
                this.frameTime = performance.now() - start;
                stats.end();
            }
        }

        this.regl.frame(func);
    }
}