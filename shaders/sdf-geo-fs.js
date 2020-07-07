const shader = glsl`
#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform sampler2D textureMap;
uniform sampler2D normalMap;
uniform sampler2D matCapMap;
uniform sampler2D specularMap;

uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

uniform samplerCube envMap;

varying vec3 vNormal;
varying vec3 vONormal;
varying vec4 vPosition;
varying vec3 vU;
varying vec3 lDir;
varying vec3 vEye;

varying vec3 v_worldPosition;
varying vec3 v_worldNormal;
varying vec3 v_position;

float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}

mat3 cotangent_frame( vec3 N, vec3 p, vec2 uv )
{
    // get edge vectors of the pixel triangle
    vec3 dp1 = dFdx( p );
    vec3 dp2 = dFdy( p );
    vec2 duv1 = dFdx( uv );
    vec2 duv2 = dFdy( uv );

    // solve the linear system
    vec3 dp2perp = cross( dp2, N );
    vec3 dp1perp = cross( N, dp1 );
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    // construct a scale-invariant frame 
    float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
    return mat3( T * invmax, B * invmax, N );
}


void main() {

  vec3 n = normalize( vONormal.xyz );
  vec3 blend_weights = abs( n );
  blend_weights = ( blend_weights - 0.2 ) * 7.;  
  blend_weights = max( blend_weights, 0. );
  blend_weights /= ( blend_weights.x + blend_weights.y + blend_weights.z );

  vec2 texScale = vec2(2.);
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

  float stripe = smoothstep(.45,.55, .5 + .5 *sin(100.*v_position.y));
  //blended_specular *= .5 + .5 * stripe;

  vec3 blended_bump = bump1 * blend_weights.xxx +  
                      bump2 * blend_weights.yyy +  
                      bump3 * blend_weights.zzz;

  vec3 tn = v_worldNormal;                   
  vec3 tanX = vec3(  tn.x, -tn.z,  tn.y );
  vec3 tanY = vec3(  tn.z,  tn.y, -tn.x );
  vec3 tanZ = vec3( -tn.y,  tn.x,  tn.z );
  vec3 blended_tangent = tanX * blend_weights.xxx +  
                         tanY * blend_weights.yyy +  
                         tanZ * blend_weights.zzz; 

  float normalScale = .5;
  vec3 normalTex = blended_bump * 2.0 - 1.0;
  normalTex.xy *= normalScale;
  normalTex = normalize( normalTex );
 // normalTex = vec3(0.,0.,1.);
  mat3 tsb = mat3( normalize( blended_tangent ), normalize( cross( vNormal, blended_tangent ) ), normalize( vNormal ) );
  vec3 finalNormal = tsb * normalTex;
  
  float rimPower = 4.;
  float useRim = 1.;
  float f = rimPower * abs( dot( finalNormal, normalize( vEye ) ) );
  f = clamp( 0., 1., useRim * ( 1. - smoothstep( 0.0, 1., f ) ) );
  blended_specular += f;

  blended_color.rgb = pow( blended_color.rgb, vec3( 1. / 2.2 ) );

  vec4 shading = vec4(0.);//textureCube(envMap, finalNormal);//1.*vec4( texture2D( matCapMap, calculatedNormal ).rgb, 1. );
  vec4 color = mix( blended_color, shading, 1. - blended_specular );
  color = blended_color * 4. * shading + f * ( shading * ( blended_specular ) );

  gl_FragColor = color;
  gl_FragColor.a = 1.;

  mat3 tbn = cotangent_frame(v_worldPosition, v_worldNormal, v_worldPosition.xy);

  vec3 dNormal = .1*finalNormal;//.1 * normalTex;
  vec3 fn = normalize(v_worldNormal +.1 * tbn*normalTex);
  vec4 refDiff = vec4(0.);
  float roughness = 2.;
  refDiff += 1.* textureCubeLodEXT(envMap, fn, roughness * 4.);
  gl_FragColor += refDiff;

  vec4 refSpec = vec4(0.);
  vec3 worldNormal = fn;//normalize(v_worldNormal + dNormal);
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - cameraPosition);
  fn = reflect(eyeToSurfaceDir,worldNormal);
  roughness = 2.;
  refSpec += .9 * textureCubeLodEXT(envMap, fn, roughness * 4.);
  refSpec += .6*  textureCubeLodEXT(envMap, fn, roughness * 2.);
  refSpec += .3*  textureCubeLodEXT(envMap, fn, roughness * 1.);
  gl_FragColor += blended_specular * 2.* refSpec;
 // gl_FragColor = vec4(mat3(viewMatrix) * finalNormal,1.);
//  gl_FragColor = textureCubeLodEXT(envMap, finalNormal);

  //gl_FragColor = vec4(tbn * normalTex, 1.);
  //gl_FragColor = vec4(f, f, f, 1.);
}`;

export { shader };
