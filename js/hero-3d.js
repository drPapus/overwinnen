import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js";
import { Reflector } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/objects/Reflector.js";
import {
  createSphereReflectionEnvironment,
  disposeSphereReflectionEnvironment,
  updateSphereReflectionOnce,
} from "../src/environment/sphereReflectionEnvironment.js";
import { createBackgroundTitle } from "../src/objects/backgroundTitle.js";
import {
  createBottomGlowMaterial,
  createContactShadowMaterial,
  createCrystalMaterial,
  createGlassSphereMaterial,
  createSphereFresnelMaterial,
  createStudioBackgroundMaterial,
  createStudioCycloramaMaterial,
  createStudioFloorMaterial,
  STUDIO_COLOR,
} from "../src/materials/index.js";

// Generate a studio-like reflection map procedurally; no external HDR is needed.
function setupEnvironment(renderer, scene) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const environmentTarget = pmremGenerator.fromScene(roomEnvironment);

  scene.environment = environmentTarget.texture;
  roomEnvironment.dispose();
  pmremGenerator.dispose();

  return environmentTarget;
}

// Replace imported materials without touching any GLB geometry or transforms.
function applyCrystalMaterial(root) {
  const crystalMaterial = createCrystalMaterial();
  const importedMaterials = new Set();

  root.traverse((child) => {
    if (!child.isMesh) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => importedMaterials.add(material));

    child.material = crystalMaterial;
    child.castShadow = true;
    child.receiveShadow = true;
  });

  importedMaterials.forEach((material) => material?.dispose());
  return crystalMaterial;
}

// Build a continuous floor-to-wall sweep with no sharp horizon corner.
function createStudioCyclorama() {
  const width = 30;
  const floorFront = 10;
  const curveStart = -5;
  const curveRadius = 5;
  const curveSegments = 24;
  const floorY = -0.012;
  const sections = [
    { y: floorY, z: floorFront },
    { y: floorY, z: curveStart },
  ];

  for (let index = 1; index <= curveSegments; index += 1) {
    const angle = (index / curveSegments) * (Math.PI / 2);
    sections.push({
      y: floorY + curveRadius * (1 - Math.cos(angle)),
      z: curveStart - curveRadius * Math.sin(angle),
    });
  }

  const positions = [];
  const uvs = [];
  const indices = [];
  sections.forEach((section, index) => {
    const v = index / (sections.length - 1);
    positions.push(-width / 2, section.y, section.z);
    positions.push(width / 2, section.y, section.z);
    uvs.push(0, v, 1, v);

    if (index === sections.length - 1) return;
    const offset = index * 2;
    indices.push(offset, offset + 2, offset + 1);
    indices.push(offset + 1, offset + 2, offset + 3);
  });

  const cycloramaGeometry = new THREE.BufferGeometry();
  cycloramaGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  cycloramaGeometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uvs, 2),
  );
  cycloramaGeometry.setIndex(indices);
  cycloramaGeometry.computeVertexNormals();

  const cycloramaMaterial = createStudioCycloramaMaterial();
  const cyclorama = new THREE.Mesh(cycloramaGeometry, cycloramaMaterial);
  cyclorama.renderOrder = -4;

  // This clip-space quad covers the viewport independently of camera aspect.
  const backgroundGeometry = new THREE.PlaneGeometry(2, 2);
  const backgroundMaterial = createStudioBackgroundMaterial();
  const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
  background.frustumCulled = false;
  background.renderOrder = -1000;

  const group = new THREE.Group();
  group.add(background, cyclorama);
  return {
    group,
    cycloramaGeometry,
    cycloramaMaterial,
    backgroundGeometry,
    backgroundMaterial,
  };
}

// Combine a dim planar reflection with a polished near-black floor surface.
function createReflectiveFloor(width, height) {
  const geometry = new THREE.PlaneGeometry(30, 30);
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  const textureWidth = Math.min(Math.round(width * pixelRatio), 2048);
  const textureHeight = Math.min(Math.round(height * pixelRatio), 2048);
  const reflector = new Reflector(geometry, {
    clipBias: 0.003,
    textureWidth,
    textureHeight,
    color: STUDIO_COLOR.getHex(),
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = -0.008;
  reflector.renderOrder = -2;

  const reflectionFade = createRadialTexture(
    "rgb(205, 205, 205)",
    "rgb(255, 255, 255)",
  );
  reflectionFade.repeat.set(8, 8);
  reflectionFade.offset.set(-3.5, -3.5);
  const overlayMaterial = createStudioFloorMaterial(reflectionFade);
  const overlay = new THREE.Mesh(geometry, overlayMaterial);
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.y = -0.006;
  overlay.renderOrder = -1;

  const group = new THREE.Group();
  group.add(reflector, overlay);

  return { group, geometry, overlayMaterial, reflectionFade, reflector };
}

// Generate reusable radial textures without loading image assets.
function createRadialTexture(innerColor, outerColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, outerColor);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Place a soft, wide shadow directly beneath the sphere.
function createContactShadow() {
  const texture = createRadialTexture("rgba(0, 0, 0, 1)", "rgba(0, 0, 0, 0)");
  const material = createContactShadowMaterial(texture);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.32), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.004;
  mesh.renderOrder = 1;
  return { mesh, texture, material };
}

// Add a concentrated blue-white glow at the glass/floor contact point.
function createBottomGlow() {
  const texture = createRadialTexture(
    "rgba(205, 233, 255, 1)",
    "rgba(125, 190, 255, 0)",
  );
  const material = createBottomGlowMaterial(texture);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.002;
  mesh.renderOrder = 2;
  return { mesh, texture, material };
}

// Shape sphere highlights from above, the side, and the contact point.
function setupSphereLighting(scene) {
  const topLight = new THREE.DirectionalLight(0xd6e8ff, 0.55);
  topLight.position.set(0, 7, 3);

  const sideLight = new THREE.DirectionalLight(0x8fb5dc, 0.25);
  sideLight.position.set(-6, 2, 2);

  const contactLight = new THREE.PointLight(0xbfdfff, 0.35, 8);
  contactLight.position.set(0, -4, 2);

  scene.add(topLight, sideLight, contactLight);
}

const hero = document.querySelector(".hero-section");
const canvas = document.querySelector("#hero-canvas");

if (hero && canvas) {
  const scene = new THREE.Scene();
  scene.background = STUDIO_COLOR;
  const camera = new THREE.PerspectiveCamera(
    75,
    hero.clientWidth / hero.clientHeight,
    0.1,
    1000,
  );
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(hero.clientWidth, hero.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.75;
  renderer.shadowMap.enabled = true;
  // Preserve fine refraction detail in the transmission pass.
  renderer.transmissionResolutionScale = 1;

  const environmentTarget = setupEnvironment(renderer, scene);
  const studio = createStudioCyclorama();
  scene.add(studio.group);

  let model = null;
  let crystalMaterial = null;
  const glassSphereGroup = new THREE.Group();
  const sphereGeometry = new THREE.SphereGeometry(0.35, 128, 96);
  const sphereGlassMaterial = createGlassSphereMaterial();
  const sphereFresnelMaterial = createSphereFresnelMaterial();
  const glassSphere = new THREE.Mesh(sphereGeometry, sphereGlassMaterial);
  const sphereFresnel = new THREE.Mesh(sphereGeometry, sphereFresnelMaterial);
  sphereFresnel.scale.setScalar(1.010);
  glassSphereGroup.add(glassSphere, sphereFresnel);
  //scene.add(glassSphereGroup);

  // Give the sphere a static, low-contrast environment without room softboxes.
  const sphereReflection = createSphereReflectionEnvironment(scene);
  sphereGlassMaterial.envMap = sphereReflection.renderTarget.texture;
  sphereGlassMaterial.needsUpdate = true;

  let backgroundTitle = null;
  let titleLoadSettled = false;
  let sphereReflectionUpdated = false;
  let isDisposed = false;

  // Capture only after both asynchronous scene objects have their final position.
  function finalizeSphereReflection() {
    if (!model || !titleLoadSettled || sphereReflectionUpdated || isDisposed) {
      return;
    }

    if (backgroundTitle) {
      backgroundTitle.mesh.position.set(
        glassSphereGroup.position.x,
        glassSphereGroup.position.y + 0.3,
        glassSphereGroup.position.z - 2,
      );
    }

    scene.updateMatrixWorld(true);
    updateSphereReflectionOnce(
      renderer,
      scene,
      sphereReflection,
      glassSphereGroup,
    );
    sphereReflectionUpdated = true;
  }

  createBackgroundTitle(scene)
    .then((title) => {
      if (isDisposed) {
        title.geometry.dispose();
        title.material.dispose();
        scene.remove(title.mesh);
        return;
      }

      backgroundTitle = title;
      titleLoadSettled = true;
      finalizeSphereReflection();
    })
    .catch((error) => {
      titleLoadSettled = true;
      console.error("Failed to create the 3D background title.", error);
      finalizeSphereReflection();
    });

  const reflectiveFloor = createReflectiveFloor(
    hero.clientWidth,
    hero.clientHeight,
  );
  scene.add(reflectiveFloor.group);

  const contactShadow = createContactShadow();
  const bottomGlow = createBottomGlow();
  const floorEffects = new THREE.Group();
  floorEffects.add(contactShadow.mesh, bottomGlow.mesh);
  scene.add(floorEffects);

  function loadModel() {
    const loader = new GLTFLoader();

    loader.load(
      "./src/assets/models/aim-human.glb",
      (gltf) => {
        model = gltf.scene;
        model.scale.setScalar(0.8);

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.y -= bounds.min.y;
        glassSphereGroup.position.set(0, center.y - bounds.min.y, -center.z);
        floorEffects.position.z = -center.z;

        crystalMaterial = applyCrystalMaterial(model);

        scene.add(model);
        finalizeSphereReflection();
        console.info("AIM human model loaded successfully.");
      },
      (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.info(`Loading AIM human model: ${progress}%`);
        } else {
          console.info(`Loading AIM human model: ${event.loaded} bytes received`);
        }
      },
      (error) => {
        console.error("Failed to load AIM human model.", error);
      },
    );
  }

  // Keep broad illumination weak so the crystal retains a dark transparent core.
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.06);
  scene.add(ambientLight);

  // Side and rear directional lights create narrow contour highlights.
  const crystalKeyLight = new THREE.DirectionalLight(0xb8d9ff, 1.2);
  crystalKeyLight.position.set(4, 5, 6);
  scene.add(crystalKeyLight);

  const crystalRimLight = new THREE.DirectionalLight(0xffffff, 1.6);
  crystalRimLight.position.set(-5, -2, -4);
  scene.add(crystalRimLight);

  const crystalFillLight = new THREE.DirectionalLight(0x6f8fbf, 0.35);
  crystalFillLight.position.set(0, -2, 4);
  scene.add(crystalFillLight);

  setupSphereLighting(scene);

  camera.position.set(-0.2, 0.35, 0.7);

  loadModel();
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const sphereScale = 0.75 + Math.sin(clock.getElapsedTime()) * 0.005;
    glassSphereGroup.scale.setScalar(sphereScale);
    if (model) {
      model.rotation.y += 0.0005;
    }
    renderer.render(scene, camera);
  }

  function resize() {
    const width = hero.clientWidth;
    const height = hero.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);

    const reflectionPixelRatio = Math.min(window.devicePixelRatio, 2);
    reflectiveFloor.reflector.getRenderTarget().setSize(
      Math.min(Math.round(width * reflectionPixelRatio), 2048),
      Math.min(Math.round(height * reflectionPixelRatio), 2048),
    );
  }

  new ResizeObserver(resize).observe(hero);

  window.addEventListener("pagehide", () => {
    isDisposed = true;
    if (model) {
      model.traverse((child) => {
        if (!child.isMesh) return;

        child.geometry?.dispose();
      });
    }
    sphereGeometry.dispose();
    sphereGlassMaterial.dispose();
    sphereFresnelMaterial.dispose();
    disposeSphereReflectionEnvironment(sphereReflection);
    if (backgroundTitle) {
      backgroundTitle.geometry.dispose();
      backgroundTitle.material.dispose();
    }
    reflectiveFloor.reflector.getRenderTarget().dispose();
    reflectiveFloor.reflector.material.dispose();
    reflectiveFloor.overlayMaterial.dispose();
    reflectiveFloor.reflectionFade.dispose();
    reflectiveFloor.geometry.dispose();
    studio.cycloramaGeometry.dispose();
    studio.cycloramaMaterial.dispose();
    studio.backgroundGeometry.dispose();
    studio.backgroundMaterial.dispose();
    contactShadow.mesh.geometry.dispose();
    contactShadow.material.dispose();
    contactShadow.texture.dispose();
    bottomGlow.mesh.geometry.dispose();
    bottomGlow.material.dispose();
    bottomGlow.texture.dispose();
    crystalMaterial?.dispose();
    environmentTarget.dispose();
    renderer.dispose();
  });

  animate();
}
