import ShapeDefinition from "./Shape";

export const createCubeDefinition = (size : number) : ShapeDefinition => ({
    vertex: [
        [-size, +size, +size], [+size, +size, +size], [+size, -size, +size], [-size, -size, +size], // positive z face.
        [+size, +size, +size], [+size, +size, -size], [+size, -size, -size], [+size, -size, +size], // positive x face
        [+size, +size, -size], [-size, +size, -size], [-size, -size, -size], [+size, -size, -size], // negative z face
        [-size, +size, -size], [-size, +size, +size], [-size, -size, +size], [-size, -size, -size], // negative x face.
        [-size, +size, -size], [+size, +size, -size], [+size, +size, +size], [-size, +size, +size], // top face
        [-size, -size, -size], [+size, -size, -size], [+size, -size, +size], [-size, -size, +size]  // bottom face
    ],
    
    elements: [
        [2, 1, 0], [2, 0, 3],       // positive z face.
        [6, 5, 4], [6, 4, 7],       // positive x face.
        [10, 9, 8], [10, 8, 11],    // negative z face.
        [14, 13, 12], [14, 12, 15], // negative x face.
        [18, 17, 16], [18, 16, 19], // top face.
        [20, 21, 22], [23, 20, 22]  // bottom face
    ],

    normals: [
         // side faces
        [0.0, 0.0, +1.0], [0.0, 0.0, +1.0], [0.0, 0.0, +1.0], [0.0, 0.0, +1.0],
        [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0],
        [0.0, 0.0, -1.0], [0.0, 0.0, -1.0], [0.0, 0.0, -1.0], [0.0, 0.0, -1.0],
        [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0],
        // top
        [0.0, +1.0, 0.0], [0.0, +1.0, 0.0], [0.0, +1.0, 0.0], [0.0, +1.0, 0.0],
        // bottom
        [0.0, -1.0, 0.0], [0.0, -1.0, 0.0], [0.0, -1.0, 0.0], [0.0, -1.0, 0.0]
    ]
})

const CubeDefinition = createCubeDefinition(0.5);

export default CubeDefinition;