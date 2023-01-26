import { mat4, vec3 } from "gl-matrix";
import { Texture3D } from "regl";
import ObjectTransform from "../Shared/Object";
import { BitflagDebugger, BitflagMaxValue } from "../Utility/EnumUtil";
import { NUM_CHANNELS } from "./contants";


export interface ChunkProps {
    tex: Texture3D;
    model: mat4;
    size: number;
    offset: vec3;
    index: number;
}


export type ChunkIndex = number;
export type ChunkData = Uint8Array;

export const ChunkFillSideValue = {
    Top: 1,  // PY
    Bottom: 2, // NY
    Right: 4, // PX
    Left: 8, // NX
    Back: 16, // PZ
    Front: 32, // NZ
} as const;

export type ChunkFillSide = keyof typeof ChunkFillSideValue;

export const ChunkSides : ChunkFillSide[] = Object.keys(ChunkFillSideValue) as ChunkFillSide[];

export const ChunkSideDirection : Record<ChunkFillSide, vec3> = {
    Top:    [0, 1, 0],  
    Bottom: [0, -1, 0], 
    Right:  [1, 0, 0], 
    Left:   [-1, 0, 0], 
    Back:   [0, 0, 1], 
    Front:  [0, 0, -1], 
};

export const ChunkSideOpposing : Record<ChunkFillSide, ChunkFillSide> = {
    Top:    "Bottom",  
    Bottom: "Top", 
    Right:  "Left", 
    Left:   "Right", 
    Back:   "Front", 
    Front:  "Back", 
}

export const ChunkFillSideDebugger = BitflagDebugger(ChunkFillSideValue);

export const ALL_CHUNK_SIDES_FILLED = BitflagMaxValue(ChunkFillSideValue);

export interface Chunk {
    position : vec3;
    data : ChunkData;
    texture : Texture3D;
    transform : ObjectTransform;
    isEmpty : boolean;
    isObscured : boolean;
    resolution: number;
    filled : number;
    neighbourObscureFlag : number;
}

export const isChunkSideFilled = (chunk : Chunk, side : ChunkFillSide) => (chunk.filled & ChunkFillSideValue[side]) !== 0;
export const isAnyChunkSideFilled = (chunk : Chunk, ...sides : ChunkFillSide[]) => (chunk.filled & sides.map(x => ChunkFillSideValue[x]).reduce((ps, a) => ps + a, 0)) !== 0;

// XYZ => Index = (x + y * res + z * res * res) * NUM_CHANNELS

export function getChunkFilledSides(chunk : Chunk) : number {
    // Start filled, then remove if not filled
    let filled = ALL_CHUNK_SIDES_FILLED;

    const MAX_X = chunk.resolution - 1;
    const MAX_Y = MAX_X * chunk.resolution;
    const MAX_Z = MAX_Y * chunk.resolution;
    const resSq = chunk.resolution * chunk.resolution;

    let index = 0;
    // Front side
    front:
    for(let x = 0; x < chunk.resolution; x++) {
        for(let y = 0; y < chunk.resolution; y++) {
            index = NUM_CHANNELS * (x + y * chunk.resolution) + 3;
            if(chunk.data[index] === 0) {
                filled -= ChunkFillSideValue.Front;
                break front;
            }
        }
    }

    back:
    for(let x = 0; x < chunk.resolution; x++) {
        for(let y = 0; y < chunk.resolution; y++) {
            index = NUM_CHANNELS * (x + y * chunk.resolution + MAX_Z) + 3;
            if(chunk.data[index] === 0) {
                filled -= ChunkFillSideValue.Back;
                break back;
            }
        }
    }

    right:
    for(let z = 0; z < chunk.resolution; z++) {
        for(let y = 0; y < chunk.resolution; y++) {
            index = NUM_CHANNELS * (y * chunk.resolution + z * resSq) + 3;
            if(chunk.data[index] === 0) {
                filled -= ChunkFillSideValue.Right;
                break right;
            }
        }
    }

    left:
    for(let z = 0; z < chunk.resolution; z++) {
        for(let y = 0; y < chunk.resolution; y++) {
            index = NUM_CHANNELS * (MAX_X + y * chunk.resolution + z * resSq) + 3;
            if(chunk.data[index] === 0) {
                filled -= ChunkFillSideValue.Left;
                break left;
            }
        }
    }

    top:
    for(let z = 0; z < chunk.resolution; z++) {
        for(let x = 0; x < chunk.resolution; x++) {
            index = NUM_CHANNELS * (x + MAX_Y + z * resSq) + 3;
            if(chunk.data[index] === 0) {
                filled -= ChunkFillSideValue.Top;
                break top;
            }
        }
    }

    bottom:
    for(let z = 0; z < chunk.resolution; z++) {
        for(let x = 0; x < chunk.resolution; x++) {
            index = NUM_CHANNELS * (x + z * resSq) + 3;
            if(chunk.data[index] === 0) {
                filled -= ChunkFillSideValue.Bottom;
                break bottom;
            }
        }
    }


    return filled;
}