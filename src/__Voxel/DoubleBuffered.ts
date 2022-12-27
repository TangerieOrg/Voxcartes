import { Regl, FramebufferOptions } from "regl";

export default function DoubleBuffered(regl : Regl, opts : FramebufferOptions) {
    const fbos = [
        regl.framebuffer(opts),
        regl.framebuffer(opts)
    ]

    let index = 0;

    const ping = () => fbos[index];
    const pong = () => fbos[1 - index];
    const swap = () => index = 1 - index;

    const resize = (width : number, height : number) => {
        opts.width = width;
        opts.height = height;
        ping()(opts);
        pong()(opts);
    }

    return { ping, pong, swap, resize };
}