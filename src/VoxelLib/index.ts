import REGL from "regl";
import compat from "./compat";

export function createRegl() {
    return compat.overrideContextType(() => REGL({
        extensions: ['webgl_draw_buffers', 'oes_texture_float']
    }))
}