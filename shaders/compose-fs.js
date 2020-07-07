import { shader as FXAA } from "./fxaa.js";

const shader = `
precision highp float;

uniform sampler2D fbo;
uniform vec2 resolution;

varying vec2 vUv;
varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;

${FXAA}

void main() {
  gl_FragColor = fxaa(fbo, vUv * resolution, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
}
`;

export { shader };
