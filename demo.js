import { WebGLRenderer, Vector4 } from "./third_party/three.module.js";
import { OrbitControls } from "./third_party/OrbitControls.js";
import { Effect as IntroEffect } from "./effects/intro.js";
import { Composer } from "./js/Composer.js";
import * as dat from "./third_party/dat.gui.module.js";

const gui = new dat.GUI();

const params = new (function () {
  this.exposureDiffuse = 0.5;
  this.exposureSpecular = 0.5;
  this.roughness = 2;
  this.normalScale = 0.5;
  this.texScale = 2;
  this.stripeFreq = 10;
  this.stripeOffset = 0;
  this.stripeColor = new Vector4(0, 0.1, 0.1, 0.1);
  this.baseColor = new Vector4(0.1, 0, 0, 0.1);
  this.blurExposure = 1;
  this.blurRadius = 1;
  this.blurStrength = 1;
})();

const geoShaderFolder = gui.addFolder("Geo Shader");
geoShaderFolder.add(params, "exposureDiffuse", 0, 3);
geoShaderFolder.add(params, "exposureSpecular", 0, 3);
geoShaderFolder.add(params, "roughness", 0, 3);
geoShaderFolder.add(params, "normalScale", 0, 1);
geoShaderFolder.add(params, "texScale", 0, 3);
geoShaderFolder.add(params, "stripeFreq", 0, 100);
geoShaderFolder.add(params, "stripeOffset", 0, 2 * Math.PI);

const geometryFolder = gui.addFolder("Geometry");

const postFolder = gui.addFolder("Post");
postFolder.add(params, "blurExposure", 0, 3);
postFolder.add(params, "blurRadius", 0, 3);
postFolder.add(params, "blurStrength", 0, 1);

//gui.add(params, "exposure", 0, 3);

const canvas = document.createElement("canvas");
document.body.append(canvas);
const context = canvas.getContext("webgl");

const renderer = new WebGLRenderer({ canvas, context, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0, 0);
renderer.extensions.get("OES_standard_derivatives");
renderer.extensions.get("EXT_shader_texture_lod");

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
  intro.geoShader.uniforms.exposureDiffuse.value = params.exposureDiffuse;
  intro.geoShader.uniforms.exposureSpecular.value = params.exposureSpecular;
  intro.geoShader.uniforms.roughness.value = params.roughness;
  intro.geoShader.uniforms.normalScale.value = params.normalScale;
  intro.geoShader.uniforms.texScale.value = params.texScale;
  intro.geoShader.uniforms.stripeFreq.value = params.stripeFreq;
  intro.geoShader.uniforms.stripeOffset.value = params.stripeOffset;

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
