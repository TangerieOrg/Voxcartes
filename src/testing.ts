import { mat4 } from "gl-matrix";
import { Regl } from "regl";
import BasicShader from "./VoxelLib/assets/BasicShader";
import { createShader } from "./VoxelLib/Shader/ShaderUtil";
import { createCubeDefinition } from "./VoxelLib/Shapes/Cube";
import ObjectTransform from "./VoxelLib/Shared/Object";

const cubeDef = createCubeDefinition(0.5);

interface Props {
    model: mat4;
}

export default function createTestingCommand(regl : Regl) {
    const { source: { Fragment, Vertex }} = createShader(BasicShader.source.Fragment, BasicShader.source.Vertex);

    const testCmd = regl({
        frag: Fragment,
        vert: Vertex,
        attributes: {
            vertex: cubeDef.vertex,
            normal: cubeDef.normals
        },
        elements: cubeDef.elements,
        uniforms: {
            model: regl.prop<Props>("model")
        }
    })

    const cubeTransform = new ObjectTransform();

    return () => {
        testCmd({
            model: cubeTransform.worldMatrix
        })
    }
}