import { DefaultContext, DrawCommand, Regl, Vec4 } from "regl";
import Camera from "../Camera";
import Stats from "stats.js";
import DebugUI from "../Debug/DebugUI";

const stats = new Stats();
document.body.appendChild(stats.dom);

export default class Renderer {
    private regl : Regl;
    
    private camera : Camera;

    public onFrame?: (ctxt : DefaultContext) => any;

    private clearColor : Vec4 = [0.1, 0.1, 0.1, 1];

    private cameraCommand : DrawCommand;

    public debug = new DebugUI();

    constructor(regl : Regl, camera : Camera) {
        this.regl = regl;
        this.camera = camera;
        this.cameraCommand = this.regl({
            context: camera.createContext(),
            uniforms: {
                view: (ctx) => ctx.view,
                projection: (ctx) => ctx.projection,
                viewProjection: (ctx) => ctx.viewProjection,
                cameraPosition: (ctx) => ctx.cameraPosition
            }
        })
    }

    start() {
        this.regl.frame((ctxt) => {
            stats.begin();
            this.regl.clear({
                color: this.clearColor
            });

            this.camera.handleInput();

            this.cameraCommand({}, () => {
                this.onFrame?.(ctxt);
            });

            stats.end();

            if(ctxt.tick % 30 === 0) this.debug.update();
        })
    }
}