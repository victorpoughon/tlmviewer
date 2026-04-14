// Arrow format 2D: [dx, dy, px, py, length]
// Arrow format 3D: [dx, dy, dz, px, py, pz, length]

export const arrowsScenes = [
    {
        name: "arrows/basic-2D",
        data: {
            title: "Arrows (2D)",
            mode: "2D",
            camera: "XY",
            data: [
                {
                    type: "arrows",
                    data: [
                        [1, 0, 0, 0, 3],
                        [0, 1, 5, 0, 3],
                        [1, 1, 10, 0, 3],
                    ],
                },
            ],
        },
    },
    {
        name: "arrows/basic-3D",
        data: {
            title: "Arrows (3D)",
            mode: "3D",
            camera: "orthographic",
            data: [
                {
                    type: "arrows",
                    data: [
                        [1, 0, 0, 0, 0, 0, 3],
                        [0, 1, 0, 5, 0, 0, 3],
                        [0, 0, 1, 10, 0, 0, 3],
                        [1, 1, 1, 15, 0, 0, 3],
                    ],
                },
            ],
        },
    },
];
