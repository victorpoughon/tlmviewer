export const testData2D: any[] = [
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": { "sag-type": "spherical", C: 0.1 },
        bcyl: [0, 1.27, 5],
        matrix: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
];

export const testData3D: any[] = [
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": { "sag-type": "spherical", C: 0.1 },
        bcyl: [0, 1.27, 5],
        matrix: [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
];
