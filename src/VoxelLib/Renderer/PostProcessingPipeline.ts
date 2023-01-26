import { ShaderSource } from "@VoxelLib/Shader/Shader";
import FullscreenQuad from "@VoxelLib/Shapes/FullscreenQuad";
import { unpackObjectToDot } from "@VoxelLib/Utility/UniformUtil";
import { vec2 } from "gl-matrix";
import { DefaultContext, DrawCommand, Framebuffer2D, MaybeDynamicUniforms, Regl, Texture2D } from "regl";

let tmp: any;

export default class PostProcessingPipeline {
    private regl: Regl;

    private passes: DrawCommand[] = [];

    private readonly textureA: Texture2D;
    private readonly textureB: Texture2D;

    private fboA: Framebuffer2D;
    private fboB: Framebuffer2D;

    private currentFbo: Framebuffer2D;
    private nextFbo: Framebuffer2D;

    private current: Texture2D;
    private next: Texture2D;

    private drawEffect: DrawCommand;

    private _texSize: vec2 = vec2.fromValues(1, 1);
    public get texSize() { return this._texSize };

    constructor(regl: Regl) {
        this.regl = regl;

        this.textureA = this.regl.texture({ type: 'float' });
        this.textureB = this.regl.texture({ type: 'float' });

        this.current = this.textureA;
        this.next = this.textureB;

        this.fboA = this.regl.framebuffer({
            color: this.current
        });

        this.fboB = this.regl.framebuffer({
            color: this.next
        });

        this.currentFbo = this.fboA;
        this.nextFbo = this.fboB;



        // Take in current, render to next
        this.drawEffect = this.regl({
            uniforms: unpackObjectToDot({
                post: {
                    albedo: () => this.next,
                    resolution: () => this._texSize
                }
            })
        });
    }

    add(...cmds : DrawCommand[]) {
        this.passes.push(...cmds);
    }

    addFromSource<T extends {} = {}>(shader: ShaderSource, uniforms: MaybeDynamicUniforms<T, DefaultContext, {}> = {} as T) {
        this.add(this.regl({
            frag: shader.Fragment,
            vert: shader.Vertex,
            attributes: {
                vertex: FullscreenQuad.vertex
            },
            count: FullscreenQuad.count,
            uniforms
        }));
    }

    remove(...cmds : DrawCommand[]) {
        this.passes = this.passes.filter(x => !cmds.includes(x));
    }

    resize(width: number, height: number) {
        vec2.set(this._texSize, width, height);
        this.fboA.resize(width, height);
        this.fboB.resize(width, height);
    }

    // Draw passed command to the first framebuffer, then do post processing passes
    use(cmd: () => any) {
        if(this.passes.length === 0) {
            cmd();
            return;
        }
        this.currentFbo.use(() => {
            this.regl.clear({
                color: [0, 0, 0, 0],
                depth: 1
            })
            cmd();
        });
        

        for (let i = 0; i < this.passes.length - 1; i++) {
            this.pingpong();
            this.currentFbo.use(() => {
                this.drawEffect(() => {
                    this.regl.clear({
                        color: [0, 0, 0, 0],
                        depth: 1
                    })
                    this.passes[i]();
                })
            })
        }

        if (this.passes.length > 0) {
            this.pingpong();
            this.drawEffect(() => {
                this.regl.clear({
                    color: [0, 0, 0, 0],
                    depth: 1
                })
                this.passes[this.passes.length - 1]();
            });
        }
    }

    private pingpong() {
        tmp = this.current;
        this.current = this.next;
        this.next = tmp;

        tmp = this.currentFbo;
        this.currentFbo = this.nextFbo;
        this.nextFbo = tmp;
    }
}