import * as THREE from "three";

const CRYSTAL_COLOR = 0x9fb8cf;
const METALNESS = 0;
const ROUGHNESS = 0.02;
const TRANSMISSION = 1;
const OPACITY = 1;
const THICKNESS = 0.45;
const IOR = 1.52;
const CLEARCOAT = 1;
const CLEARCOAT_ROUGHNESS = 0.015;
const SPECULAR_INTENSITY = 0.8;
const SPECULAR_COLOR = 0xddeeff;
const ENVIRONMENT_INTENSITY = 1;
const ATTENUATION_COLOR = 0x6f8ca8;
const ATTENUATION_DISTANCE = 8;

/** Creates the shared physically based material used by the crystal human. */
export function createCrystalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(CRYSTAL_COLOR),
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
    depthWrite: true,
  });
}
