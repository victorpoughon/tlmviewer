function translate2D(x: number) {
    return [
        [1, 0, x],
        [0, 1, 0],
        [0, 0, 1],
    ];
}

function translate3D(x: number) {
    return [
        [1, 0, 0, x],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];
}

export const surfaceSagScenes = [
    {
        name: "surfaceSag/all-types-2D",
        data: {
            title: "Surface sag — all types (2D)",
            mode: "2D",
            camera: "XY",
            controls: {
                show_optical_axis: true,
                show_bounding_cylinders: true,
            },
            data: [
                {
                    type: "surface-sag",
                    diameter: 10,
                    "sag-function": { "sag-type": "spherical", C: 0.1 },
                    matrix: translate2D(0),
                },
                {
                    type: "surface-sag",
                    diameter: 10,
                    "sag-function": { "sag-type": "parabolic", A: -0.05 },
                    matrix: translate2D(15),
                },
                {
                    type: "surface-sag",
                    diameter: 10,
                    "sag-function": { "sag-type": "conical", C: 0.1, K: -1.5 },
                    matrix: translate2D(30),
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
                    matrix: translate2D(45),
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
                    matrix: translate2D(60),
                },
                {
                    type: "points",
                    data: [
                        [0, 0],
                        [15, 0],
                        [30, 0],
                        [45, 0],
                        [60, 0],
                    ],
                },
            ],
        },
    },
    {
        name: "surfaceSag/all-types-3D",
        data: {
            title: "Surface sag — all types (3D)",
            mode: "3D",
            camera: "orthographic",
            controls: { show_optical_axis: true },
            data: [
                {
                    type: "surface-sag",
                    diameter: 10,
                    "sag-function": { "sag-type": "spherical", C: 0.1 },
                    matrix: translate3D(0),
                },
                {
                    type: "surface-sag",
                    diameter: 10,
                    "sag-function": { "sag-type": "parabolic", A: -0.05 },
                    matrix: translate3D(15),
                },
                {
                    type: "surface-sag",
                    diameter: 10,
                    "sag-function": { "sag-type": "conical", C: 0.1, K: -1.5 },
                    matrix: translate3D(30),
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
                    matrix: translate3D(45),
                },
            ],
        },
    },
    {
        name: "surfaceSag/xypolynomial-3D",
        data: {
            // coefficients[p][q] is the coefficient for y^p * z^q
            // XY polynomial is 3D only
            title: "Surface sag — XY polynomial (3D)",
            mode: "3D",
            camera: "orthographic",
            controls: { show_optical_axis: true, show_other_axes: true },
            data: [
                {
                    type: "surface-sag",
                    diameter: 10,
                    "sag-function": {
                        "sag-type": "xypolynomial",
                        coefficients: [
                            [0, 0.05, 0], // 0.05*z
                            [0.05, 0, 0], // 0.05*y
                            [0.01, 0, -0.01], // 0.01*y^2 - 0.01*z^2
                        ],
                    },
                    matrix: translate3D(0),
                },
            ],
        },
    },
];
