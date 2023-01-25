import { vec2 } from "gl-matrix";
import { DefaultContext, DrawCommand, Framebuffer2D, Framebuffer2DAttachment, Regl, Vec4, Texture2D } from "regl";



export default class FBOManager {
    regl : Regl;

    public clearColor : Vec4 = [0, 0, 0, 1.];

    private fbo : Framebuffer2D;

    private targets : Framebuffer2DAttachment[];

    private drawFBO : DrawCommand;

    private _texSize : vec2 = vec2.fromValues(1, 1);
    public get texSize() { return this._texSize }; 

    constructor(regl : Regl, targets : Framebuffer2DAttachment[]) {
        this.regl = regl;
        this.targets = targets;
        this.fbo = this.regl.framebuffer({
            colors: this.targets
        });

        this.drawFBO = this.regl({
            framebuffer: this.fbo
        });
    }

    private setFBO() {
        this.fbo({
            colors: this.targets
        })
    }

    public setRenderTargets(targets : Framebuffer2DAttachment[]) {
        if(this.targets === targets) return;
        this.targets = targets;
        this.setFBO();
    }

    resize(width : number, height : number) {
        vec2.set(this._texSize, width, height);
        this.fbo?.resize(width, height);
    }

    use<C extends DefaultContext>(body : (ctxt : C) => any) {
        this.drawFBO((ctxt) => {
            this.regl.clear({
                color: this.clearColor,
                depth: 1
            });

            body(ctxt as C);
        })
    }

    get(index : number) {
        return this.targets[index];
    }
}