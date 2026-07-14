import * as THREE from "three";
import { createSphereReflectionCardMaterial } from "../materials/index.js";

const SPHERE_REFLECTION_LAYER = 2;
const CUBE_MAP_SIZE = 256;

function createReflectionCard(width, height, opacity, position) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = createSphereReflectionCardMaterial(opacity);
  const card = new THREE.Mesh(geometry, material);
  card.position.copy(position);
  card.lookAt(0, 0, 0);
  card.layers.set(SPHERE_REFLECTION_LAYER);
  return { card, geometry, material };
}

/** Creates three narrow highlight strips visible only to the sphere cube camera. */
export function createSphereReflectionCards() {
  const top = createReflectionCard(
    0.95,
    0.025,
    0.28,
    new THREE.Vector3(0, 0.72, 0.18),
  );
  const left = createReflectionCard(
    0.025,
    0.72,
    0.22,
    new THREE.Vector3(-0.68, 0.08, 0.12),
  );
  const right = createReflectionCard(
    0.018,
    0.52,
    0.16,
    new THREE.Vector3(0.64, 0.12, -0.08),
  );
  const cards = [top, left, right];
  const group = new THREE.Group();
  cards.forEach(({ card }) => group.add(card));
  return { group, cards };
}

/** Creates the low-resolution, sphere-only reflection capture environment. */
export function createSphereReflectionEnvironment(scene) {
  const renderTarget = new THREE.WebGLCubeRenderTarget(CUBE_MAP_SIZE, {
    type: THREE.HalfFloatType,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 10, renderTarget);
  cubeCamera.children.forEach((faceCamera) => {
    faceCamera.layers.set(SPHERE_REFLECTION_LAYER);
  });

  const reflectionCards = createSphereReflectionCards();
  scene.add(cubeCamera, reflectionCards.group);

  return { cubeCamera, reflectionCards, renderTarget };
}

/** Captures the static sphere environment once without the sphere itself. */
export function updateSphereReflectionOnce(
  renderer,
  scene,
  environment,
  sphereRoot,
) {
  const worldPosition = new THREE.Vector3();
  sphereRoot.getWorldPosition(worldPosition);
  environment.cubeCamera.position.copy(worldPosition);
  environment.reflectionCards.group.position.copy(worldPosition);
  environment.reflectionCards.group.visible = true;
  environment.reflectionCards.group.updateMatrixWorld(true);

  const wasVisible = sphereRoot.visible;
  sphereRoot.visible = false;
  environment.cubeCamera.update(renderer, scene);
  sphereRoot.visible = wasVisible;
  environment.reflectionCards.group.visible = false;
}

/** Disposes all GPU resources owned by the sphere reflection environment. */
export function disposeSphereReflectionEnvironment(environment) {
  environment.reflectionCards.cards.forEach(({ geometry, material }) => {
    geometry.dispose();
    material.dispose();
  });
  environment.renderTarget.dispose();
}
