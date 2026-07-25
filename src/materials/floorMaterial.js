import * as THREE from "three";

const CONTACT_SHADOW_OPACITY = 0.18;

/** Creates the transparent material for the procedural floor contact shadow. */
export function createContactShadowMaterial(map) {
  return new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    opacity: CONTACT_SHADOW_OPACITY,
    depthWrite: false,
  });
}
