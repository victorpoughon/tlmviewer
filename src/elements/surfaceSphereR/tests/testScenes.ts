export const surfaceSphereRScenes = [
    {
        name: "surfaceSphereR/basic-2D",
        data: {
            title: "Surface sphere-R (2D)",
            mode: "2D",
            camera: "XY",
            controls: { show_optical_axis: true },
            data: [
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
            ],
        },
    },
    {
        name: "surfaceSphereR/basic-3D",
        data: {
            title: "Surface sphere-R (3D)",
            mode: "3D",
            camera: "orthographic",
            controls: { show_optical_axis: true },
            data: [
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
            ],
        },
    },
];
