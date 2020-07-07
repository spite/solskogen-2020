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
  BufferGeometry,
  IcosahedronBufferGeometry,
  ClampToEdgeWrapping,
  RepeatWrapping,
  TextureLoader,
} from "../third_party/three.module.js";
import { RoundedFlatTorus } from "../js/RoundedFlatTorusGeometry.js";
import { ShaderPass } from "../js/ShaderPass.js";
import { shader as vertexShader } from "../shaders/ortho-vs.js";
import { sdTetrahedron, sdSphere, sdRoundBox } from "../js/geometry.js";
import { pointsOnSphere } from "../js/pointsOnSphere.js";

import { shader as geoVs } from "../shaders/sdf-geo-vs.js";
const geoFs = glsl`
precision highp float;

uniform sampler2D textureMap;
uniform sampler2D normalMap;
uniform sampler2D matCapMap;
uniform sampler2D specularMap;

varying vec3 vNormal;
varying vec3 vONormal;
varying vec4 vPosition;
varying vec3 vU;
varying vec3 lDir;
varying vec3 vEye;

float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}

void main() {

  vec3 n = normalize( vONormal.xyz );
  vec3 blend_weights = abs( n );
  blend_weights = ( blend_weights - 0.2 ) * 7.;  
  blend_weights = max( blend_weights, 0. );
  blend_weights /= ( blend_weights.x + blend_weights.y + blend_weights.z );

  vec2 texScale = vec2( 3. );
  vec2 coord1 = vPosition.yz * texScale;
  vec2 coord2 = vPosition.zx * texScale;
  vec2 coord3 = vPosition.xy * texScale;

  vec4 col1 = texture2D( textureMap, coord1 );  
  vec4 col2 = texture2D( textureMap, coord2 );  
  vec4 col3 = texture2D( textureMap, coord3 ); 

  vec4 spec1 = texture2D( specularMap, coord1 );  
  vec4 spec2 = texture2D( specularMap, coord2 );  
  vec4 spec3 = texture2D( specularMap, coord3 ); 

  vec3 bump1 = texture2D( normalMap, coord1 ).rgb;  
  vec3 bump2 = texture2D( normalMap, coord2 ).rgb;  
  vec3 bump3 = texture2D( normalMap, coord3 ).rgb; 

  vec4 blended_color = col1 * blend_weights.xxxx +  
                       col2 * blend_weights.yyyy +  
                       col3 * blend_weights.zzzz; 

  vec4 blended_specular = spec1 * blend_weights.xxxx +  
                          spec2 * blend_weights.yyyy +  
                          spec3 * blend_weights.zzzz; 

  vec3 blended_bump = bump1 * blend_weights.xxx +  
                      bump2 * blend_weights.yyy +  
                      bump3 * blend_weights.zzz;

  vec3 tanX = vec3(  vNormal.x, -vNormal.z,  vNormal.y );
  vec3 tanY = vec3(  vNormal.z,  vNormal.y, -vNormal.x );
  vec3 tanZ = vec3( -vNormal.y,  vNormal.x,  vNormal.z );
  vec3 blended_tangent = tanX * blend_weights.xxx +  
                         tanY * blend_weights.yyy +  
                         tanZ * blend_weights.zzz; 

  float normalScale = .5;
  vec3 normalTex = blended_bump * 2.0 - 1.0;
  normalTex.xy *= normalScale;
  normalTex = normalize( normalTex );
  mat3 tsb = mat3( normalize( blended_tangent ), normalize( cross( vNormal, blended_tangent ) ), normalize( vNormal ) );
  vec3 finalNormal = tsb * normalTex;

  vec3 r = reflect( normalize( vU ), normalize( finalNormal ) );
  float m = 2.0 * sqrt( r.x * r.x + r.y * r.y + ( r.z + 1.0 ) * ( r.z + 1.0 ) );
  vec2 calculatedNormal = vec2( r.x / m + 0.5,  r.y / m + 0.5 );

  float rimPower = 1.;
  float useRim = 1.;
  float f = rimPower * abs( dot( finalNormal, normalize( vEye ) ) );
  f = clamp( 0., 1., useRim * ( 1. - smoothstep( 0.0, 1., f ) ) );

  blended_color.rgb = pow( blended_color.rgb, vec3( 1. / 2.2 ) );

  vec4 shading = vec4( texture2D( matCapMap, calculatedNormal ).rgb, 1. );
  vec4 color = mix( blended_color, shading, 1. - blended_specular );
  color = blended_color * 4. * shading + f * ( shading * ( blended_specular ) );

  //float noise = .05;
  //color.rgb += noise * ( .5 - random( vec3( 1. ), length( gl_FragCoord ) ) );

  gl_FragColor = color;
  gl_FragColor.a = 1.;

  //gl_FragColor.rgb = shading.rgb;
  //gl_FragColor.a = opacity * ( 1. - f );

  /*vec2 blended_coord = coord1 * blend_weights.xx +
                       coord2 * blend_weights.yy +
                       coord3 * blend_weights.zz;

  gl_FragColor = vec4( texture2D( textureMap, blended_coord ).rgb, 1. );*/
  
}

`;

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
const mat = concrete;

const loader = new TextureLoader();
const matCapTex = loader.load("../assets/matcap.jpg");
const diffuse = loader.load(`../assets/${mat.diffuse}`);
const normal = loader.load(`../assets/${mat.normal}`);
const specular = loader.load(`../assets/${mat.specular}`);

matCapTex.wrapS = matCapTex.wrapT = ClampToEdgeWrapping;
diffuse.wrapS = diffuse.wrapT = RepeatWrapping;
normal.wrapS = normal.wrapT = RepeatWrapping;
specular.wrapS = specular.wrapT = RepeatWrapping;

const geoShader = new RawShaderMaterial({
  uniforms: {
    time: { value: 0 },
    matCapMap: { value: matCapTex },
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

class Effect extends glEffectBase {
  constructor(renderer) {
    super(renderer);
    this.post = new ShaderPass(this.renderer, shader);
    shader.uniforms.fbo.value = this.fbo.texture;
  }

  async initialise() {
    super.initialise();
    const lights = [];
    lights[0] = new PointLight(0xffffff, 1, 0);
    //lights[1] = new PointLight(0xffffff, 1, 0);
    //lights[2] = new PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, 200, 0);
    //lights[1].position.set(100, 200, 100);
    //lights[2].position.set(-100, -200, -100);

    this.scene.add(lights[0]);
    //scene.add(lights[1]);
    //scene.add(lights[2]);

    const meshMaterial = new MeshStandardMaterial({
      color: 0x156289,
      emissive: 0x072534,
      //shading: FlatShading,
      wireframe: true,
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
    this.mesh.rotation.y = t;
    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.post.render();
  }
}

export { Effect };
