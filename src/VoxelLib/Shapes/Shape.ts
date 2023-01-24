import { vec3 } from "gl-matrix";

export default interface ShapeDefinition {
    vertex: vec3[];
    elements?: vec3[];
    normals?: vec3[];
}