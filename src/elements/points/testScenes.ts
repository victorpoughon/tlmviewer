export const pointsScenes = [
    {
        name: "points/basic-2D",
        data: {
            title: "Points (2D)",
            mode: "2D",
            camera: "XY",
            data: [
                {
                    type: "points",
                    data: [
                        [0, 0],
                        [5, 2],
                        [10, -1],
                        [15, 3],
                    ],
                },
            ],
        },
    },
    {
        name: "points/basic-3D",
        data: {
            title: "Points (3D)",
            mode: "3D",
            camera: "orthographic",
            data: [
                {
                    type: "points",
                    data: [
                        [0, 0, 0],
                        [5, 2, 1],
                        [10, -1, 2],
                        [15, 3, -1],
                    ],
                },
            ],
        },
    },
];
