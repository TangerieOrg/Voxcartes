import { defaultsDeep } from "lodash";
import REGL, { InitializationOptions } from "regl";
import compat from "./compat";
import DebugConsole from "./Debug/DebugConsole";

DebugConsole.setActive(false);

const defaultOptions : InitializationOptions = {
    extensions: ['webgl_draw_buffers', 'oes_texture_float']
}

export function createRegl(options : InitializationOptions = {}) {
    const opts = defaultsDeep({}, options, defaultOptions);
    opts.extensions = [...(options.extensions ?? []), 'webgl_draw_buffers', 'oes_texture_float']
    
    return compat.overrideContextType(() => REGL(opts));
}