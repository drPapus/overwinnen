import * as THREE from "three";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/geometries/TextGeometry.js";
import { createBackgroundTitleMaterial } from "../materials/index.js";

const TITLE = "OverWinnen";
const FONT_URL =
  "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_regular.typeface.json";
// Match this scene's sub-unit sculpture scale while remaining wider than the sphere.
const TARGET_WIDTH = 4.2;
const TITLE_POSITION = new THREE.Vector3(0, 0.35, -4);
const SPHERE_REFLECTION_LAYER = 2;

/** Creates the static, oversized 3D title behind the hero sculpture. */
export async function createBackgroundTitle(scene) {
  const font = await new FontLoader().loadAsync(FONT_URL);
  const geometry = new TextGeometry(TITLE, {
    font,
    size: 1,
    depth: 0.025,
    curveSegments: 10,
    bevelEnabled: false,
  });
  geometry.computeBoundingBox();
  geometry.center();

  const titleWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
  const scale = TARGET_WIDTH / titleWidth;
  const material = createBackgroundTitleMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(scale);
  mesh.position.copy(TITLE_POSITION);
  mesh.layers.enable(SPHERE_REFLECTION_LAYER);
  mesh.renderOrder = -3;
  scene.add(mesh);

  return { mesh, geometry, material };
}
