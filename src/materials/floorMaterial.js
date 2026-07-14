import * as THREE from "three";
import { createStudioFloorMaterial } from "./studioMaterial.js";

const CONTACT_SHADOW_OPACITY = 0.35;
const BOTTOM_GLOW_OPACITY = 0.22;

/** Creates the polished dark overlay material for the reflective studio floor. */
export function createFloorMaterial(alphaMap) {
  return createStudioFloorMaterial(alphaMap);
}

/** Creates the transparent material for the procedural floor contact shadow. */
export function createContactShadowMaterial(map) {
  return new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    opacity: CONTACT_SHADOW_OPACITY,
    depthWrite: false,
  });
}

/** Creates the additive material for the sphere's floor-contact glow. */
export function createBottomGlowMaterial(map) {
  return new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    opacity: BOTTOM_GLOW_OPACITY,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
