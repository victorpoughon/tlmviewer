// 5 rays fanning from origin to x=20, spread over y=-4..4, 2D format: [x1,y1, x2,y2]
const fanRays2D = Array.from({ length: 5 }, (_, i) => {
    const y = -4 + i * 2;
    return [0, 0, 20, y];
});

// Same fan in 3D format: [x1,y1,z1, x2,y2,z2]
const fanRays3D = Array.from({ length: 5 }, (_, i) => {
    const y = -4 + i * 2;
    return [0, 0, 0, 20, y, 0];
});

// Field variable: one value per ray
const fieldValues = [-2, -1, 0, 1, 2];
const fieldDomain = { field: [-2, 2] };
const fieldVariables = { field: fieldValues };

export const raysScenes = [
    {
        name: "rays/default-color-2D",
        data: {
            title: "Rays — default color (2D)",
            mode: "2D",
            camera: "XY",
            data: [
                {
                    type: "rays",
                    points: fanRays2D,
                    color: "#ffa724",
                    variables: {},
                    domain: {},
                    layers: [0],
                },
            ],
        },
    },
    {
        name: "rays/variable-color-2D",
        data: {
            title: "Rays — variable color (2D)",
            mode: "2D",
            camera: "XY",
            data: [
                {
                    type: "rays",
                    points: fanRays2D,
                    color: "#ffa724",
                    variables: fieldVariables,
                    domain: fieldDomain,
                    layers: [0],
                },
            ],
        },
    },
    {
        name: "rays/default-color-3D",
        data: {
            title: "Rays — default color (3D)",
            mode: "3D",
            camera: "orthographic",
            data: [
                {
                    type: "rays",
                    points: fanRays3D,
                    color: "#ffa724",
                    variables: {},
                    domain: {},
                    layers: [0],
                },
            ],
        },
    },
];
