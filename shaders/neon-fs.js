const shader = `
precision highp float;

uniform vec4 color;

void main() {
  gl_FragColor = color;
}
`;

export { shader };
