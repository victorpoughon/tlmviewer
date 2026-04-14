// Compute [sag(y), y] samples for a spherical profile: sag(y) = R - sign(R)*sqrt(R²-y²)
function sphericalSamples(
    R: number,
    diameter: number,
    N: number,
): number[][] {
    const yMax = diameter / 2;
    return Array.from({ length: N }, (_, i) => {
        const y = -yMax + (i * 2 * yMax) / (N - 1);
        const x = R - Math.sign(R) * Math.sqrt(R * R - y * y);
        return [x, y];
    });
}

// Half-profile (y >= 0) for 3D lathe geometry
function sphericalHalfSamples(
    R: number,
    diameter: number,
    N: number,
): number[][] {
    const yMax = diameter / 2;
    return Array.from({ length: N }, (_, i) => {
        const y = (i * yMax) / (N - 1);
        const x = R - Math.sign(R) * Math.sqrt(R * R - y * y);
        return [x, y];
    });
}

export const surfaceLatheScenes = [
    {
        name: "surfaceLathe/spherical-2D",
        data: {
            title: "Surface lathe — spherical profile (2D)",
            mode: "2D",
            camera: "XY",
            controls: { show_optical_axis: true },
            data: [
                {
                    type: "surface-lathe",
                    samples: sphericalSamples(20, 10, 51),
                    matrix: [
                        [1, 0, 0],
                        [0, 1, 0],
                        [0, 0, 1],
                    ],
                },
                {
                    type: "surface-lathe",
                    samples: sphericalSamples(-20, 10, 51),
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
        name: "surfaceLathe/spherical-3D",
        data: {
            title: "Surface lathe — spherical profile (3D)",
            mode: "3D",
            camera: "orthographic",
            controls: { show_optical_axis: true },
            data: [
                {
                    type: "surface-lathe",
                    samples: sphericalHalfSamples(20, 10, 51),
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
