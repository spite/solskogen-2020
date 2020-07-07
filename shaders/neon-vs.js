const shader = `
precision highp float;

attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec4 color;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
}
`;

export { shader };
