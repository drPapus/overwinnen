import * as THREE from "three";

const RIM_COLOR = 0xbfdcff;
const RIM_INTENSITY = 0.45;
const FRESNEL_POWER = 3.5;
const CENTER_OPACITY = 0.015;

const VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 rimColor;
  uniform float rimIntensity;
  uniform float fresnelPower;
  uniform float centerOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float facing = max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0);
    float fresnel = pow(1.0 - facing, fresnelPower);
    float topBias = mix(0.6, 1.0, smoothstep(-0.25, 0.8, vNormal.y));
    float opacity = centerOpacity + fresnel * topBias * rimIntensity;
    gl_FragColor = vec4(rimColor, opacity);
  }
`;

/** Creates the additive view-dependent rim material for the glass sphere. */
export function createSphereFresnelMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      rimColor: { value: new THREE.Color(RIM_COLOR) },
      rimIntensity: { value: RIM_INTENSITY },
      fresnelPower: { value: FRESNEL_POWER },
      centerOpacity: { value: CENTER_OPACITY },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}
