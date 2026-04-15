export const testData2D: any[] = [
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": { "sag-type": "spherical", C: 0.1 },
        matrix: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": { "sag-type": "parabolic", A: -0.05 },
        matrix: [
            [1, 0, 15],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": { "sag-type": "conical", C: 0.1, K: -1.5 },
        matrix: [
            [1, 0, 30],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": {
            "sag-type": "aspheric",
            C: 0.1,
            K: 0,
            coefficients: [0, -1e-4, 0],
        },
        matrix: [
            [1, 0, 45],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": {
            "sag-type": "sum",
            terms: [
                { "sag-type": "spherical", C: 0.08 },
                { "sag-type": "parabolic", A: 0.02 },
            ],
        },
        matrix: [
            [1, 0, 60],
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
        matrix: [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": { "sag-type": "parabolic", A: -0.05 },
        matrix: [
            [1, 0, 0, 15],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": { "sag-type": "conical", C: 0.1, K: -1.5 },
        matrix: [
            [1, 0, 0, 30],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": {
            "sag-type": "aspheric",
            C: 0.1,
            K: 0,
            coefficients: [0, 0, 1e-4],
        },
        matrix: [
            [1, 0, 0, 45],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
    {
        type: "surface-sag",
        diameter: 10,
        "sag-function": {
            "sag-type": "xypolynomial",
            coefficients: [
                [0, 0.05, 0],
                [0.05, 0, 0],
                [0.01, 0, -0.01],
            ],
        },
        matrix: [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
];
