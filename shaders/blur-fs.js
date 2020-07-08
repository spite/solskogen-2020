import { blur13 } from "./fast-separable-gaussian-blur.js";

const shader = `
precision highp float;

uniform vec2 resolution;
uniform sampler2D inputTexture;
uniform vec2 direction;

varying vec2 vUv;

${blur13}

void main() {
  gl_FragColor = blur13(inputTexture, vUv, resolution, direction);
}`;

export { shader };
