import { vec3 } from "gl-matrix";
import REGL from "regl";
import Camera from "./Camera";
import DoubleBuffered from "./DoubleBuffered";
import DisplayShader from "./shaders/display";
import SampleShader from "./shaders/sample";
import Stage from "./Stage";
import { getColorType } from "./Util";


export default function Renderer() {
    const regl = REGL({
        optionalExtensions: [
            "OES_texture_float",
            "OES_texture_half_float",
            "WEBGL_color_buffer_float",
            "EXT_color_buffer_half_float"
        ],
        attributes: {
            antialias: false,
            preserveDrawingBuffer: true
        }
    });

    const colorType = getColorType(regl);

    const sunDistance = 149600000000;
    let sunPosition: vec3 = [0, 0, 0]
    vec3.scale(
        sunPosition,
        vec3.normalize([0, 0, 0], [1.11, -0.0, 0.25]),
        sunDistance
    );

    const pingpong = DoubleBuffered(regl, {
        width: regl._gl.canvas.width,
        height: regl._gl.canvas.height,
        colorType
    });
    
    const canvas = regl._gl.canvas;

    const ndcBox = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];

    const tRandSize = 1024;

    const t2Sphere = (function () {
        const data = new Float32Array(tRandSize * tRandSize * 3);
        for (let i = 0; i < tRandSize * tRandSize; i++) {
            const r = vec3.random([0, 0, 0]);
            data[i * 3 + 0] = r[0];
            data[i * 3 + 1] = r[1];
            data[i * 3 + 2] = r[2];
        }
        return regl.texture({
            width: tRandSize,
            height: tRandSize,
            format: "rgb",
            type: "float",
            data: data,
            wrap: "repeat",
        });
    })();

    const t3Sphere = (function () {
        const data = new Float32Array(tRandSize * tRandSize * 3);
        for (let i = 0; i < tRandSize * tRandSize; i++) {
            const r = vec3.random([0, 0, 0], Math.random());
            data[i * 3 + 0] = r[0];
            data[i * 3 + 1] = r[1];
            data[i * 3 + 2] = r[2];
        }
        return regl.texture({
            width: tRandSize,
            height: tRandSize,
            format: "rgb",
            type: "float",
            data: data,
            wrap: "repeat",
        });
    })();

    const tUniform2 = (function () {
        const data = new Float32Array(tRandSize * tRandSize * 2);
        for (let i = 0; i < tRandSize * tRandSize; i++) {
            data[i * 2 + 0] = Math.random();
            data[i * 2 + 1] = Math.random();
        }
        return regl.texture({
            width: tRandSize,
            height: tRandSize,
            format: "luminance alpha",
            type: "float",
            data: data,
            wrap: "repeat",
        });
    })();

    const tUniform1 = (function () {
        const data = new Float32Array(tRandSize * tRandSize * 1);
        for (let i = 0; i < tRandSize * tRandSize; i++) {
            data[i] = Math.random();
        }
        return regl.texture({
            width: tRandSize,
            height: tRandSize,
            format: "luminance",
            type: "float",
            data: data,
            wrap: "repeat",
        });
    })();

    const sampleShader = regl({
        vert: SampleShader.Vertex,
        frag: SampleShader.Fragment,
        attributes: {
            position: ndcBox,
        },
        uniforms: {
            source: regl.prop("source"),
            invpv: regl.prop("invpv"),
            eye: regl.prop("eye"),
            res: regl.prop("res"),
            resFrag: regl.prop("resFrag"),
            tUniform1: tUniform1,
            tUniform2: tUniform2,
            t2Sphere: t2Sphere,
            t3Sphere: t3Sphere,
            tOffset: regl.prop("tOffset"),
            tRGB: regl.prop("tRGB"),
            tRMET: regl.prop("tRMET"),
            tRi: regl.prop("tRi"),
            tIndex: regl.prop("tIndex"),
            dofDist: regl.prop("dofDist"),
            dofMag: regl.prop("dofMag"),
            resStage: regl.prop("resStage"),
            invResRand: [1 / tRandSize, 1 / tRandSize],
            lightPosition: regl.prop("lightPosition"),
            lightIntensity: regl.prop("lightIntensity"),
            lightRadius: regl.prop("lightRadius"),
            groundColor: regl.prop("groundColor"),
            groundRoughness: regl.prop("groundRoughness"),
            groundMetalness: regl.prop("groundMetalness"),
            bounds: regl.prop("bounds"),
        },
        depth: {
            enable: false,
            mask: false,
        },
        viewport: regl.prop("viewport"),
        framebuffer: regl.prop("destination"),
        count: 6
    });

    const cmdDisplay = regl({
        vert: DisplayShader.Vertex,
        frag: DisplayShader.Fragment,
        attributes: {
            position: ndcBox,
        },
        uniforms: {
            source: regl.prop("source"),
            fraction: regl.prop("fraction"),
            tUniform1: tUniform1,
            tUniform1Res: [tUniform1.width, tUniform1.height],
        },
        depth: {
            enable: false,
            mask: false,
        },
        viewport: regl.prop("viewport"),
        count: 6,
    });

    function calculateSunPosition(time : number, azimuth : number) : vec3 {
        const theta = (2 * Math.PI * (time - 6)) / 24;
        return [
            sunDistance * Math.cos(azimuth) * Math.cos(theta),
            sunDistance * Math.sin(theta),
            sunDistance * Math.sin(azimuth) * Math.cos(theta),
        ];
    }

    let sampleCount = 0;

    function sample(stage : Stage, camera : Camera, opts : any) {
        const sp = calculateSunPosition(opts.time, opts.azimuth);
        if (vec3.distance(sp, sunPosition) > 0.001) {
            sunPosition = sp;
        }
        for (let i = 0; i < opts.count; i++) {
            sampleShader({
                eye: camera.eye,
                invpv: camera.inverseProjectionView(),
                res: [canvas.width, canvas.height],
                tOffset: [Math.random(), Math.random()],
                tRGB: stage.tRGB,
                tRMET: stage.tRMET,
                tRi: stage.tRi,
                tIndex: stage.tIndex,
                resStage: stage.tIndex.width,
                bounds: [stage.width, stage.height, stage.depth],
                lightPosition: sunPosition,
                lightIntensity: opts.lightIntensity,
                lightRadius: 695508000 * opts.lightRadius,
                groundRoughness: opts.groundRoughness,
                groundColor: opts.groundColor,
                groundMetalness: opts.groundMetalness,
                dofDist: opts.dofDist,
                dofMag: opts.dofMag,
                source: pingpong.ping(),
                destination: pingpong.pong(),
                viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
            });
            pingpong.swap();
            sampleCount++;
        }
    }

    function display() {
        cmdDisplay({
            source: pingpong.ping(),
            viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        });
    }

    function reset() {
        if (
            pingpong.ping().width !== canvas.width ||
            pingpong.ping().height !== canvas.height
        ) {
            pingpong.ping()({
                width: canvas.width,
                height: canvas.height,
                colorType,
            });
            pingpong.pong()({
                width: canvas.width,
                height: canvas.height,
                colorType,
            });
        }
        regl.clear({ color: [0, 0, 0, 1], framebuffer: pingpong.ping() });
        regl.clear({ color: [0, 0, 0, 1], framebuffer: pingpong.pong() });
        sampleCount = 0;
    }

    return {
        context: regl,
        sample: sample,
        display: display,
        reset: reset,
        sampleCount: function () {
            return sampleCount;
        },
    };
}
