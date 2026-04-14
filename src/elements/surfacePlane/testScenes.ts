export const surfacePlaneScenes = [
    {
        name: "surfacePlane/basic-2D",
        data: {
            title: "Surface plane (2D)",
            mode: "2D",
            camera: "XY",
            controls: { show_optical_axis: true },
            data: [
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
            ],
        },
    },
    {
        name: "surfacePlane/basic-3D",
        data: {
            title: "Surface plane (3D)",
            mode: "3D",
            camera: "orthographic",
            controls: { show_optical_axis: true },
            data: [
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
            ],
        },
    },
];
