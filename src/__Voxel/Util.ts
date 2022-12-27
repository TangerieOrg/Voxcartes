import { Regl } from "regl";

export function getColorType(regl : Regl) {
    if (
      regl.hasExtension("OES_texture_float") &&
      regl.hasExtension("WEBGL_color_buffer_float")
    ) {
      return "float";
    }
    if (
      regl.hasExtension("OES_texture_half_float") ||
      regl.hasExtension("EXT_color_buffer_half_float")
    ) {
      return "half float";
    }
    throw new Error(
      "Vixel requires the capability to render to floating point textures."
    );
}