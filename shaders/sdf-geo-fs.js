const shader = glsl`
//#extension GL_EXT_shader_texture_lod : enable

precision highp float;

uniform sampler2D textureMap;
uniform sampler2D normalMap;
uniform sampler2D matCapMap;
uniform sampler2D specularMap;

uniform mat3 normalMatrix;

uniform samplerCube envMap;

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
  
  gl_FragColor += textureCube(envMap, normalMatrix * finalNormal);
}`;

export { shader };
