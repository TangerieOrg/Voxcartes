import { DrawCommand, Regl } from "regl";

export type ShaderSource = {Vertex : string, Fragment : string};

export interface ShaderInitType {
    source : ShaderSource;
}

export default class Shader {
    regl : Regl;
    source : ShaderSource;
    command : DrawCommand;


    constructor(regl : Regl, { source } : ShaderInitType) {
        this.regl = regl;
        this.source = source;

        this.command = regl({
            vert: source.Vertex,
            frag: source.Fragment,
            attributes: {
                position: [[0, -1], [-1, 0], [1, 1]]
            },
            uniforms: {
                width: regl.context('viewportWidth'),
                height: regl.context('viewportHeight')
            },
            count: 1
        });
    }

    draw() {
        this.command()
    }
}