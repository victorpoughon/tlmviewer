import { parseSagFunction, glslRender } from "../src/elements/SurfaceSagElement.ts";

// const str = `{
//                 "sag-type": "sum",
//                 "terms": [
//                     {
//                         "sag-type": "spherical",
//                         "C": 1.0
//                     },
//                     {
//                         "sag-type": "aspheric",
//                         "coefficients": [
//                             0.5,
//                             1.0
//                         ]
//                     }
//                 ]
//             }`;

// const str = `{"sag-type": "spherical", "C": 1.0}`;

const str = `{"sag-type": "sum", "terms": [{"sag-type": "conical", "K": -1.600000023841858, "C": -0.06666667014360428}, {"sag-type": "aspheric", "coefficients": [0.00011999999696854502]}]}`;

// Generate a random string that's also valid GLSL function identifier
function randomGLSLid() {
    const uuid = crypto.randomUUID();
    return "uuid_" + uuid.replace(/[^a-zA-Z0-9_]/g, '_');
}

const sag = parseSagFunction(JSON.parse(str));


const vertexShader = glslRender(sag.shaderG(), sag.shaderGgrad(), sag.name);

console.log(vertexShader);

// shader3D returns a list of functions to declare
// and the current sag function shader function name (entry point)

// top level concatenates all function bodies in the right order
// calls top level entry point
