const shader = `
precision highp float;

uniform vec2 resolution;
uniform sampler2D inputTexture;
uniform vec2 direction;

varying vec2 vUv;

void main() {
  vec4 c = texture2D(inputTexture, vUv);
  float a = c.a - 1.;
  c.rgb *= a;
  c.a = 1.;
  gl_FragColor = c;
}`;

export { shader };
