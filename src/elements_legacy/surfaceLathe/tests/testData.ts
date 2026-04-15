function sphericalSamples(R: number, diameter: number, N: number): number[][] {
    const yMax = diameter / 2;
    return Array.from({ length: N }, (_, i) => {
        const y = -yMax + (i * 2 * yMax) / (N - 1);
        const x = R - Math.sign(R) * Math.sqrt(R * R - y * y);
        return [x, y];
    });
}

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

export const testData2D: any[] = [
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
];

export const testData3D: any[] = [
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
];
