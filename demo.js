import { WebGLRenderer, Vector4, Color } from "./third_party/three.module.js";
import { OrbitControls } from "./third_party/OrbitControls.js";
import { Effect as IntroEffect } from "./effects/intro.js";
import { Composer } from "./js/Composer.js";
import * as dat from "./third_party/dat.gui.module.js";
import * as features from "../js/features.js";

const gui = new dat.GUI();

const params = new (function () {
  this.tetrahedronFactor = 1;
  this.cubeFactor = 0;
  this.octahedronFactor = 0;
  this.dodecahedronFactor = 0;
  this.icosahedronFactor = 0;
  this.sphereFactor = 0;
  this.smoothness = 0.05;
  this.twistX = 0;
  this.twistY = 0;
  this.twistZ = 0;

  this.exposureDiffuse = 0.5;
  this.exposureSpecular = 0.5;
  this.roughness = 2;
  this.normalScale = 0.5;
  this.texScale = 2;
  this.stripeFreq = 10;
  this.stripeOffset = 0;
  this.stripeColor = [0, 0, 0];
  this.stripeColorIntensity = 0;
  this.baseColor = [0, 0, 0];
  this.baseColorIntensity = 0;
  this.ambientColor = [0, 0, 0];
  this.ambientColorIntensity = 0;
  this.blurExposure = 1;
  this.blurRadius = 1;
  this.blurStrength = 1;

  this.opacity = 1;
})();

const geoShaderFolder = gui.addFolder("Geo Shader");
geoShaderFolder.add(params, "exposureDiffuse", 0, 3, 0.01);
geoShaderFolder.add(params, "exposureSpecular", 0, 3, 0.01);
geoShaderFolder.add(params, "roughness", 0, 3, 0.01);
geoShaderFolder.add(params, "normalScale", 0, 1, 0.01);
geoShaderFolder.add(params, "texScale", 0, 3, 0.01);
geoShaderFolder.add(params, "stripeFreq", 0, 100, 0.01);
geoShaderFolder.add(params, "stripeOffset", 0, 2 * Math.PI, 0.01);
geoShaderFolder.addColor(params, "stripeColor");
geoShaderFolder.add(params, "stripeColorIntensity", 0, 10, 0.01);
geoShaderFolder.addColor(params, "baseColor");
geoShaderFolder.add(params, "baseColorIntensity", 0, 10, 0.01);
geoShaderFolder.addColor(params, "ambientColor");
geoShaderFolder.add(params, "ambientColorIntensity", 0, 10, 0.01);
geoShaderFolder.open();

const geometryFolder = gui.addFolder("Geometry");
geometryFolder.add(params, "smoothness", 0.02, 1, 0.01);
geometryFolder.add(params, "tetrahedronFactor", 0, 2, 0.01);
geometryFolder.add(params, "cubeFactor", 0, 2, 0.01);
geometryFolder.add(params, "octahedronFactor", 0, 2, 0.01);
geometryFolder.add(params, "dodecahedronFactor", 0, 2, 0.01);
geometryFolder.add(params, "icosahedronFactor", 0, 2, 0.01);
geometryFolder.add(params, "sphereFactor", 0, 2, 0.01);
geometryFolder.add(params, "twistX", 0.0, 1, 0.01);
geometryFolder.add(params, "twistY", 0.0, 1, 0.01);
geometryFolder.add(params, "twistZ", 0.0, 1, 0.01);
geometryFolder.open();

const postFolder = gui.addFolder("Post");
postFolder.add(params, "blurExposure", 0, 3, 0.01);
postFolder.add(params, "blurRadius", 0, 1, 0.01);
postFolder.add(params, "blurStrength", 0, 2, 0.01);
postFolder.add(params, "opacity", 0, 1, 0.01);
postFolder.open();

const canvas = document.createElement("canvas");
document.body.append(canvas);
const context = canvas.getContext("webgl");

const renderer = new WebGLRenderer({
  canvas,
  context,
  preserveDrawingBuffer: false,
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0, 0);
renderer.extensions.get("OES_standard_derivatives");
if (features.canDoTexLOD()) {
  renderer.extensions.get("EXT_shader_texture_lod");
}

const composer = new Composer(renderer, 1, 1);

const effects = [];
const intro = new IntroEffect(renderer);

effects.push(intro);

const controls = new OrbitControls(intro.camera, renderer.domElement);
controls.screenSpacePanning = true;

const loading = document.querySelector("#loading");
const start = document.querySelector("#start");
start.addEventListener("click", () => {
  run();
});

function render(t) {
  intro.geoShader.uniforms.smoothness.value = params.smoothness;
  intro.geoShader.uniforms.twistX.value = params.twistX;
  intro.geoShader.uniforms.twistY.value = params.twistY;
  intro.geoShader.uniforms.twistZ.value = params.twistZ;
  intro.geoShader.uniforms.tetrahedronFactor.value = params.tetrahedronFactor;
  intro.geoShader.uniforms.cubeFactor.value = params.cubeFactor;
  intro.geoShader.uniforms.octahedronFactor.value = params.octahedronFactor;
  intro.geoShader.uniforms.icosahedronFactor.value = params.icosahedronFactor;
  intro.geoShader.uniforms.dodecahedronFactor.value = params.dodecahedronFactor;
  intro.geoShader.uniforms.sphereFactor.value = params.sphereFactor;

  intro.geoShader.uniforms.baseColor.value.set(
    params.baseColor[0] / 255,
    params.baseColor[1] / 255,
    params.baseColor[2] / 255,
    params.baseColorIntensity
  );
  intro.geoShader.uniforms.stripeColor.value.set(
    params.stripeColor[0] / 255,
    params.stripeColor[1] / 255,
    params.stripeColor[2] / 255,
    params.stripeColorIntensity
  );
  intro.geoShader.uniforms.ambientColor.value.set(
    params.ambientColor[0] / 255,
    params.ambientColor[1] / 255,
    params.ambientColor[2] / 255,
    params.ambientColorIntensity
  );
  intro.geoShader.uniforms.exposureDiffuse.value = params.exposureDiffuse;
  intro.geoShader.uniforms.exposureSpecular.value = params.exposureSpecular;
  intro.geoShader.uniforms.roughness.value = params.roughness;
  intro.geoShader.uniforms.normalScale.value = params.normalScale;
  intro.geoShader.uniforms.texScale.value = params.texScale;
  intro.geoShader.uniforms.stripeFreq.value = params.stripeFreq;
  intro.geoShader.uniforms.stripeOffset.value = params.stripeOffset;

  intro.final.shader.uniforms.radius.value = params.blurRadius;
  intro.blurStrength = params.blurStrength;
  intro.final.shader.uniforms.exposure.value = params.blurExposure;
  intro.post.shader.uniforms.opacity.value = params.opacity;

  intro.render(audio.currentTime);
  composer.render(intro.post.fbo);
  requestAnimationFrame(render);
}

function resize() {
  let w = window.innerWidth;
  let h = window.innerHeight;
  renderer.setSize(w, h);

  const dPR = window.devicePixelRatio;
  w *= dPR;
  h *= dPR;
  intro.setSize(w, h);
  composer.setSize(w, h);
}

window.addEventListener("resize", resize);

const audio = document.createElement("audio");
audio.src = "./assets/track.mp3";
audio.preload = true;
const audioPromise = new Promise((resolve, reject) => {
  audio.addEventListener("canplay", (e) => {
    resolve();
  });
});

window.promises = [];

async function init() {
  console.log("Loading...");
  const preload = []; //[audioPromise];
  for (const effect of effects) {
    preload.push(effect.initialise());
  }
  await Promise.all(preload);
  resize();
  loading.style.display = "none";
  start.style.display = "flex";
  console.log("Ready...");
  run();
}

function run() {
  start.style.display = "none";
  console.log("Start");
  //audio.play();
  //audio.controls = true;
  //document.body.append(audio);
  render();
}

init();
