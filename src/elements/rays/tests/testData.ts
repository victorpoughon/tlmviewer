const fanRays2D = Array.from({ length: 5 }, (_, i) => {
    const y = -4 + i * 2;
    return [0, 0, 20, y];
});

const fanRays3D = Array.from({ length: 5 }, (_, i) => {
    const y = -4 + i * 2;
    return [0, 0, 0, 20, y, 0];
});

const fieldValues = [-2, -1, 0, 1, 2];
const fieldDomain = { field: [-2, 2] as [number, number] };
const fieldVariables = { field: fieldValues };

export const testData2D: any[] = [
    {
        type: "rays",
        points: fanRays2D,
        color: "#ffa724",
        variables: {},
        domain: {},
        layers: [0],
    },
    {
        type: "rays",
        points: fanRays2D,
        color: "#ffa724",
        variables: fieldVariables,
        domain: fieldDomain,
        layers: [0],
    },
];

export const testData3D: any[] = [
    {
        type: "rays",
        points: fanRays3D,
        color: "#ffa724",
        variables: {},
        domain: {},
        layers: [0],
    },
];
