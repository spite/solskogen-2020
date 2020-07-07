import { glEffectBase } from "../js/glEffectBase.js";
import {
  PointLight,
  Mesh,
  MeshStandardMaterial,
  Vector2,
  Object3D,
  Matrix4,
  BoxBufferGeometry,
  BufferAttribute,
  MeshNormalMaterial,
  RawShaderMaterial,
  Vector3,
  MeshBasicMaterial,
  IcosahedronBufferGeometry,
  ClampToEdgeWrapping,
  RepeatWrapping,
  TextureLoader,
  Group,
  CubeCamera,
  WebGLCubeRenderTarget,
  RGBFormat,
  LinearMipmapLinearFilter,
  TorusBufferGeometry,
  Color,
} from "../third_party/three.module.js";
import { ShaderPass } from "../js/ShaderPass.js";
import { shader as vertexShader } from "../shaders/ortho-vs.js";
import Maf from "../third_party/maf.js";

import { shader as geoVs } from "../shaders/sdf-geo-vs.js";
import { shader as geoFs } from "../shaders/sdf-geo-fs.js";

const fragmentShader = `
precision highp float;

uniform sampler2D fbo;

varying vec2 vUv;

void main() {
  vec4 c = texture2D(fbo, vUv);
  gl_FragColor = c;// vec4(vec3(1.) - c.rgb, c.a);
}
`;

const shader = new RawShaderMaterial({
  uniforms: {
    fbo: { value: null },
    resolution: { value: new Vector2(1, 1) },
  },
  vertexShader,
  fragmentShader,
});

const concrete = {
  diffuse: "Concrete_011_COLOR.jpg",
  normal: "Concrete_011_NORM.jpg",
  specular: "Concrete_011_ROUGH.jpg",
};

const water = {
  diffuse: "Wavy_Water - Color Map.png",
  normal: "Wavy_Water - Height (Normal Map).png",
  specular: "Wavy_Water - specular.png",
};

const slate = {
  diffuse: "slate-diffuse.png",
  normal: "slate-normal.png",
  specular: "slate-specular.png",
};

const groundWet = {
  diffuse: "ground_wet_003_basecolor.jpg",
  normal: "ground_wet_003_normal.jpg",
  specular: "ground_wet_003_roughness.jpg",
};

const scrap = {
  diffuse: "scrap-diffuse.png",
  normal: "scrap-normal.png",
  specular: "scrap-specular.png",
};
const mat = scrap;

const loader = new TextureLoader();
const matCapTex = loader.load("../assets/matcap.jpg");
const diffuse = loader.load(`../assets/${mat.diffuse}`);
const normal = loader.load(`../assets/${mat.normal}`);
const specular = loader.load(`../assets/${mat.specular}`);

matCapTex.wrapS = matCapTex.wrapT = ClampToEdgeWrapping;
diffuse.wrapS = diffuse.wrapT = RepeatWrapping;
normal.wrapS = normal.wrapT = RepeatWrapping;
specular.wrapS = specular.wrapT = RepeatWrapping;

class Effect extends glEffectBase {
  constructor(renderer) {
    super(renderer);
    this.post = new ShaderPass(this.renderer, shader);
    shader.uniforms.fbo.value = this.fbo.texture;
  }

  async initialise() {
    super.initialise();

    this.ring1 = new Group();
    for (let j = 0; j < 100; j++) {
      const color = new Color(
        Maf.randomInRange(0.5, 1),
        Maf.randomInRange(0.5, 1),
        Maf.randomInRange(0.5, 1)
      );
      // color.g = color.b = 0;
      const mat = new MeshBasicMaterial({ color });
      const h = Maf.randomInRange(1, 2);
      const s = Maf.randomInRange(0.1, 2);
      const geo = new BoxBufferGeometry(s, s, h);
      const mesh = new Mesh(geo, mat);
      const a = Maf.randomInRange(0, Maf.TAU);
      const r = 4;
      mesh.position.x = r * Math.cos(a);
      mesh.position.y = r * Math.sin(a);
      mesh.position.z = Maf.randomInRange(-50, 50);
      mesh.userData.offset = Maf.randomInRange(0, 1);
      this.ring1.add(mesh);
    }
    this.scene.add(this.ring1);

    this.ring2 = new Group();
    for (let j = 0; j < 20; j++) {
      const color = new Color(
        Maf.randomInRange(0.5, 1),
        Maf.randomInRange(0.5, 1),
        Maf.randomInRange(0.5, 1)
      );
      // color.g = color.b = 0;
      const mat = new MeshBasicMaterial({ color });
      const r = Maf.randomInRange(10, 20);
      const r2 = Maf.randomInRange(0.1, 2);
      const geo = new TorusBufferGeometry(r, r2, 3, 36);
      const mesh = new Mesh(geo, mat);
      mesh.position.x = 0;
      mesh.position.y = 0;
      mesh.position.z = Maf.randomInRange(-50, 50);
      mesh.userData.offset = Maf.randomInRange(0, 1);
      this.ring2.add(mesh);
    }
    this.scene.add(this.ring2);

    this.cubeRenderTarget = new WebGLCubeRenderTarget(1024, {
      format: RGBFormat,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
    });

    this.cubeCamera = new CubeCamera(0.1, 20, this.cubeRenderTarget);
    this.scene.add(this.cubeCamera);

    const geoShader = new RawShaderMaterial({
      uniforms: {
        time: { value: 0 },
        matCapMap: { value: matCapTex },
        envMap: { value: this.cubeRenderTarget.texture },
        textureMap: {
          value: diffuse,
        },
        normalMap: {
          value: normal,
        },
        specularMap: {
          value: specular,
        },
      },
      vertexShader: geoVs,
      fragmentShader: geoFs,
      wireframe: !true,
    });

    const geometry = new IcosahedronBufferGeometry(2, 7);
    this.mesh = new Mesh(geometry, geoShader);
    this.scene.add(this.mesh);

    const box = new Mesh(
      geometry.clone(),
      new MeshNormalMaterial({ opacity: 0.5, transparent: true })
    );
    //this.scene.add(box);

    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(box.position);
  }

  setSize(w, h) {
    super.setSize(w, h);
    this.post.setSize(w, h);
    shader.uniforms.resolution.value.set(w, h);
  }

  render(t) {
    const speed = 10;
    const spread = 500;
    for (const m of this.ring1.children) {
      m.position.z =
        ((m.userData.offset * spread + speed * t) % spread) - spread / 2;
    }
    for (const m of this.ring2.children) {
      m.position.z =
        ((m.userData.offset * spread + speed * t) % spread) - spread / 2;
    }
    this.mesh.visible = false;
    this.cubeCamera.update(this.renderer, this.scene);
    this.mesh.visible = true;

    this.mesh.rotation.x = t;
    this.mesh.rotation.y = 0.1 * t;
    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.post.render();
  }
}

export { Effect };
