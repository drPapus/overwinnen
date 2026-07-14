import * as THREE from "three";
import { STUDIO_COLOR } from "./studioMaterial.js";

const TITLE_COLOR = new THREE.Color(0x8fa6c2);
const VISUAL_OPACITY = 0.32;

/** Creates a low-contrast title material that remains available to transmission. */
export function createBackgroundTitleMaterial() {
  const blendedColor = STUDIO_COLOR.clone().lerp(TITLE_COLOR, VISUAL_OPACITY);

  return new THREE.MeshBasicMaterial({
    color: blendedColor,
    depthTest: true,
    depthWrite: true,
    toneMapped: true,
  });
}
