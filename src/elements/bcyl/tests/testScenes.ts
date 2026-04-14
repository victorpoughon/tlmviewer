export const bcylScenes = [
    {
        name: "bcyl/basic-2D",
        data: {
            title: "Bounding cylinder (2D)",
            mode: "2D",
            camera: "XY",
            controls: { show_bounding_cylinders: true },
            data: [
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
            ],
        },
    },
    {
        name: "bcyl/basic-3D",
        data: {
            title: "Bounding cylinder (3D)",
            mode: "3D",
            camera: "orthographic",
            controls: { show_bounding_cylinders: true },
            data: [
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
            ],
        },
    },
];
