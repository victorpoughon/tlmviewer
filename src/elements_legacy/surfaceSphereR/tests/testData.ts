export const testData2D: any[] = [
    {
        type: "surface-sphere-r",
        diameter: 10,
        R: 20,
        matrix: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
    {
        type: "surface-sphere-r",
        diameter: 10,
        R: -20,
        matrix: [
            [1, 0, 15],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
];

export const testData3D: any[] = [
    {
        type: "surface-sphere-r",
        diameter: 10,
        R: 20,
        matrix: [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
    {
        type: "surface-sphere-r",
        diameter: 10,
        R: -20,
        matrix: [
            [1, 0, 0, 15],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
];
