import * as THREE from "three";

const GLASS_COLOR = 0x6f8296;
const METALNESS = 0;
const ROUGHNESS = 0.08;
const TRANSMISSION = 1;
const OPACITY = 1;
const THICKNESS = 0.08;
const IOR = 1.18;
const CLEARCOAT = 0.65;
const CLEARCOAT_ROUGHNESS = 0.12;
const SPECULAR_INTENSITY = 0.35;
const SPECULAR_COLOR = 0xc8dcf0;
const ENVIRONMENT_INTENSITY = 0.3;
const ATTENUATION_COLOR = 0x61758a;
const ATTENUATION_DISTANCE = 16;
const REFLECTION_CARD_COLOR = 0xdcecff;

/** Creates the transmissive optical-glass material for the hero sphere. */
export function createGlassSphereMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(GLASS_COLOR),
    metalness: METALNESS,
    roughness: ROUGHNESS,
    transmission: TRANSMISSION,
    transparent: true,
    opacity: OPACITY,
    thickness: THICKNESS,
    ior: IOR,
    clearcoat: CLEARCOAT,
    clearcoatRoughness: CLEARCOAT_ROUGHNESS,
    specularIntensity: SPECULAR_INTENSITY,
    specularColor: new THREE.Color(SPECULAR_COLOR),
    envMapIntensity: ENVIRONMENT_INTENSITY,
    attenuationColor: new THREE.Color(ATTENUATION_COLOR),
    attenuationDistance: ATTENUATION_DISTANCE,
    side: THREE.FrontSide,
    depthWrite: false,
  });
}

/** Creates a subdued, unlit material for a sphere-only reflection strip. */
export function createSphereReflectionCardMaterial(opacity) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(REFLECTION_CARD_COLOR),
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
}
