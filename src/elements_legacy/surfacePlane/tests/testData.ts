export const testData2D: any[] = [
    {
        type: "surface-plane",
        radius: 5,
        matrix: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
    {
        type: "surface-plane",
        radius: 5,
        matrix: [
            [0.866, -0.5, 15],
            [0.5, 0.866, 0],
            [0, 0, 1],
        ],
    },
];

export const testData3D: any[] = [
    {
        type: "surface-plane",
        radius: 5,
        clip_planes: [],
        matrix: [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
    {
        type: "surface-plane",
        radius: 5,
        clip_planes: [
            [0, -1, 0, 4],
            [0, 1, 0, 4],
            [0, 0, -1, 4],
            [0, 0, 1, 4],
        ],
        matrix: [
            [1, 0, 0, 15],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
];
