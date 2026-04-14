export const box3DScenes = [
    {
        name: "box3D/basic-3D",
        data: {
            title: "Box3D (3D only)",
            mode: "3D",
            camera: "orthographic",
            data: [
                {
                    type: "box3D",
                    size: [10, 10, 10],
                    matrix: [
                        [1, 0, 0, 0],
                        [0, 1, 0, 0],
                        [0, 0, 1, 0],
                        [0, 0, 0, 1],
                    ],
                },
                {
                    type: "box3D",
                    size: [5, 8, 12],
                    matrix: [
                        [1, 0, 0, 20],
                        [0, 1, 0, 0],
                        [0, 0, 1, 0],
                        [0, 0, 0, 1],
                    ],
                },
            ],
        },
    },
];
