import { WebGLRenderer } from "./third_party/three.module.js";
import { OrbitControls } from "./third_party/OrbitControls.js";
import { Effect as IntroEffect } from "./effects/intro.js";
import { Composer } from "./js/Composer.js";

const canvas = document.createElement("canvas");
document.body.append(canvas);
const context = canvas.getContext("webgl");

const renderer = new WebGLRenderer({ canvas, context, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0, 1);
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
  const preload = [audioPromise];
  for (const effect of effects) {
    preload.push(effect.initialise());
  }
  await Promise.all(preload);
  resize();
  loading.style.display = "none";
  start.style.display = "flex";
  console.log("Ready...");
  //run();
}

function run() {
  start.style.display = "none";
  console.log("Start");
  audio.play();
  render();
}

init();
