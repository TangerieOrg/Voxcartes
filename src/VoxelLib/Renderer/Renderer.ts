import { DefaultContext, DrawCommand, Framebuffer2D, Framebuffer2DAttachment, Regl, Vec4 } from "regl";
import Camera from "../Camera";
import Stats from "stats.js";
import DebugUI from "../Debug/DebugUI";
import { createShader } from "../Shader/ShaderUtil";
import SampleFBOShader from "@VoxelLib/assets/Shaders/FBO/SampleFBOShader";
import FullscreenQuad from "@VoxelLib/Shapes/FullscreenQuad";
import FBOManager from "./FBOManager";
import { AsContext } from "@VoxelLib/Shared/DataUtil";
import { CameraContext } from "@VoxelLib/Camera/Camera";
import { vec3 } from "gl-matrix";


const stats = new Stats();
document.body.appendChild(stats.dom);

export type RenderContext = DefaultContext & AsContext<CameraContext>;

const sampleFBOShader = createShader(SampleFBOShader.source.Fragment, SampleFBOShader.source.Vertex);

const lightPos : vec3 = vec3.create();
vec3.set(lightPos, 0, -1, 1);

export default class Renderer {
    private regl : Regl;
    
    private camera : Camera;

    public onFrame?: (ctxt : RenderContext) => any;

    private clearColor : Vec4 = [0.1, 0.1, 0.1, 1];

    private cameraCommand : DrawCommand;

    public debug = new DebugUI();


    private renderFBO : DrawCommand;

    public fboManager : FBOManager;

    constructor(regl : Regl, camera : Camera) {
        this.regl = regl;
        this.camera = camera;
        this.cameraCommand = this.regl({
            context: camera.createContext(),
            uniforms: {
                view: (ctx) => ctx.view,
                projection: (ctx) => ctx.projection,
                viewProjection: (ctx) => ctx.viewProjection,
                cameraPosition: (ctx) => ctx.cameraPosition,
                cameraScale: (ctx) => ctx.cameraScale
            }
        });

        this.fboManager = new FBOManager(this.regl, [
            regl.texture({type: 'float'}), // Color
            regl.texture({type: 'float'}), // Position
        ]);

        

        // A full screen quad that renders the results of the FBO
        this.renderFBO = regl({
            frag: sampleFBOShader.source.Fragment,
            vert: sampleFBOShader.source.Vertex,
            uniforms: {
                albedoTex: this.fboManager.get(0),
                positionTex: this.fboManager.get(1),
                lightPos: () => lightPos,
                textureSize: () => this.fboManager.texSize
            },
            attributes: {
                vertex: FullscreenQuad.vertex
            },
            count: FullscreenQuad.count
        })
    }

    start() {
        
        this.regl.frame((ctxt) => {
            stats.begin();

            this.camera.handleInput();

            this.fboManager.resize(ctxt.viewportWidth, ctxt.viewportHeight);

            this.cameraCommand({}, () => {
                this.fboManager.use<RenderContext>((ctxt) => {
                    this.onFrame?.(ctxt);
                });

                this.renderFBO();
            });

            stats.end();

            if(ctxt.tick % 30 === 0) this.debug.update();
        })
    }
}