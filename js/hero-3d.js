import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js";
import { BlockSurfaceHuman } from "./three/BlockSurfaceHuman.js";
import {
  createSphereReflectionEnvironment,
  disposeSphereReflectionEnvironment,
  updateSphereReflectionOnce,
} from "../src/environment/sphereReflectionEnvironment.js";
import { createBackgroundTitle } from "../src/objects/backgroundTitle.js";
import {
  createContactShadowMaterial,
  createGlassSphereMaterial,
  createSphereFresnelMaterial,
  createStudioBackgroundMaterial,
  createStudioCycloramaMaterial,
  STUDIO_COLOR,
} from "../src/materials/index.js";

const AIM_QUALITY_PRESETS = {
  high: {
    particleCount: 4096,
    pixelRatioCap: 1.5,
    // The approved effect already runs without particle-to-particle collisions.
    particleCollisions: false,
    collisionGrid: 64,
    collisionRebuildEvery: 1,
    simulationSubsteps: 2,
    scaleTexture: true,
    physicalMaterial: true,
    bloom: false,
  },
  medium: {
    particleCount: 4096,
    pixelRatioCap: 1.25,
    particleCollisions: false,
    collisionGrid: 32,
    collisionRebuildEvery: 2,
    simulationSubsteps: 1,
    scaleTexture: true,
    physicalMaterial: true,
    bloom: false,
  },
  low: {
    // The current simulation layout remains 64x64 to preserve the approved
    // distribution. This tier removes optional work before reducing particles.
    particleCount: 4096,
    pixelRatioCap: 1,
    particleCollisions: false,
    collisionGrid: 32,
    collisionRebuildEvery: 2,
    simulationSubsteps: 1,
    scaleTexture: true,
    physicalMaterial: false,
    bloom: false,
  },
};

function selectAimQuality(renderer) {
  const requested = new URLSearchParams(window.location.search).get(
    "aimQuality",
  );
  if (requested && AIM_QUALITY_PRESETS[requested]) return requested;

  const capabilities = renderer.capabilities;
  const cores = navigator.hardwareConcurrency || 4;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrowViewport = window.matchMedia("(max-width: 720px)").matches;
  if (
    capabilities.maxTextureSize < 4096 ||
    cores <= 4 ||
    (coarsePointer && narrowViewport)
  ) {
    return "low";
  }
  if (
    capabilities.maxTextureSize < 8192 ||
    cores <= 8 ||
    window.devicePixelRatio > 2
  ) {
    return "medium";
  }
  return "high";
}

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
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.09), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.004;
  mesh.renderOrder = 1;
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

const cardPositions = document.querySelectorAll(".aim-card-position");
const cardMotionQuery = window.matchMedia("(min-width: 721px) and (prefers-reduced-motion: no-preference)");
let cardParallaxFrame = 0;

function updateCardParallax(event) {
  if (!cardMotionQuery.matches || !hero) return;

  const bounds = hero.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;

  cancelAnimationFrame(cardParallaxFrame);
  cardParallaxFrame = requestAnimationFrame(() => {
    cardPositions.forEach((card) => {
      const depth = Number(card.dataset.parallax || 0.5);
      card.style.setProperty("--parallax-x", `${(x * depth * 8).toFixed(2)}px`);
      card.style.setProperty("--parallax-y", `${(y * depth * 8).toFixed(2)}px`);
    });
  });
}

function resetCardParallax() {
  cardPositions.forEach((card) => {
    card.style.setProperty("--parallax-x", "0px");
    card.style.setProperty("--parallax-y", "0px");
  });
}

hero?.addEventListener("pointermove", updateCardParallax, { passive: true });
hero?.addEventListener("pointerleave", resetCardParallax);

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
  const qualityName = selectAimQuality(renderer);
  const quality = AIM_QUALITY_PRESETS[qualityName];
  const developmentMode =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    new URLSearchParams(location.search).has("aimDebug");

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, quality.pixelRatioCap),
  );
  renderer.setSize(hero.clientWidth, hero.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.75;
  renderer.shadowMap.enabled = false;
  // Preserve fine refraction detail in the transmission pass.
  renderer.transmissionResolutionScale = 1;

  const environmentTarget = setupEnvironment(renderer, scene);
  const studio = createStudioCyclorama();
  scene.add(studio.group);

  let model = null;
  let blockHuman = null;
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
  const initialHeroBounds = hero.getBoundingClientRect();
  let heroVisible =
    initialHeroBounds.bottom > 0 && initialHeroBounds.top < window.innerHeight;
  let documentActive = !document.hidden;
  let windowFocused = true;
  const pausedHeroAnimations = new Set();

  // Capture only after both asynchronous scene objects have their final position.
  function finalizeSphereReflection() {
    if (
      !model ||
      !titleLoadSettled ||
      sphereReflectionUpdated ||
      isDisposed ||
      !heroVisible ||
      !documentActive ||
      !windowFocused
    ) {
      return;
    }

    if (backgroundTitle) {
      backgroundTitle.mesh.position.set(
        glassSphereGroup.position.x  + 1.5,
        glassSphereGroup.position.y + 0.4,
        glassSphereGroup.position.z - 6,
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

  const contactShadow = createContactShadow();
  const groundingEffects = new THREE.Group();
  groundingEffects.add(contactShadow.mesh);
  scene.add(groundingEffects);

  function loadModel() {
    const debugParameters = new URLSearchParams(window.location.search);
    blockHuman = new BlockSurfaceHuman({
      scene,
      renderer,
      camera,
      modelUrl: "./src/assets/models/aim-human.glb",
      sdfUrl: "./src/assets/models/aim-human-sdf.bin",
      sdfMetadataUrl: "./src/assets/models/aim-human-sdf.json",
      collisionUrl:
        "./src/assets/collision/floor-collision-volume.bin",
      collisionMetadataUrl:
        "./src/assets/collision/floor-collision-volume.json",
      particleCollisions: {
        // Keep the production default off: this avoids the voxel-key, bitonic
        // sort, range, neighbor-correction, and velocity-correction passes.
        enabled: false,
        quality: qualityName === "high" ? "desktop" : "mobile",
      },
      activityDebugMode:
        debugParameters.get("particleActivityDebug") || "none",
      particleStateDebugMode:
        debugParameters.get("particleStateDebug") || "none",
      infinityDebugMode:
        debugParameters.get("infinityDebug") || "none",
      particleScaleDebugMode:
        debugParameters.get("particleScaleDebug") || "none",
      innerCrystalDebugMode:
        debugParameters.get("innerCrystalDebug") ||
        "crystal+particles",
      visualQuality: quality.physicalMaterial ? "desktop" : "mobile",
      visual: {
        preset: "dark-crystal-metal",
      },
      blockSize: 0.018,
      prepareModel: (sourceModel) => {
        sourceModel.scale.setScalar(0.8);
        const bounds = new THREE.Box3().setFromObject(sourceModel);
        const center = bounds.getCenter(new THREE.Vector3());
        sourceModel.position.x -= center.x;
        sourceModel.position.y -= bounds.min.y;
        glassSphereGroup.position.set(0, center.y - bounds.min.y, -center.z);
        groundingEffects.position.z = -center.z;
      },
      onProgress: (event) => {
        if (!developmentMode || !event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        console.info(`Loading AIM human model: ${progress}%`);
      },
    });

    blockHuman
      .load()
      .then(() => {
        model = blockHuman.sourceRoot;
        blockHuman.setVisible(heroVisible);
        blockHuman.startSimulation({ autoActivate: true });
        finalizeSphereReflection();
        if (developmentMode) {
          console.info("AIM block human model loaded successfully.");
          console.info("AIM hero performance", getPerformanceReport());
        }
      })
      .catch((error) => {
        console.error("Failed to load AIM block human model.", error);
      });
  }

  // Keep broad illumination weak so the crystal retains a dark transparent core.
  const ambientLight = new THREE.AmbientLight(0x3b4a58, 0.28);
  scene.add(ambientLight);

  // Side and rear directional lights create narrow contour highlights.
  const crystalKeyLight = new THREE.DirectionalLight(0xbad8f0, 2.1);
  crystalKeyLight.position.set(4, 5, 6);
  scene.add(crystalKeyLight);

  const crystalRimLight = new THREE.DirectionalLight(0x7290aa, 1.05);
  crystalRimLight.position.set(-5, -2, -4);
  scene.add(crystalRimLight);

  const crystalFillLight = new THREE.DirectionalLight(0x6f8fbf, 0.35);
  crystalFillLight.position.set(0, -2, 4);
  scene.add(crystalFillLight);

  setupSphereLighting(scene);

  camera.position.set(-0.2, 0.35, 0.7);

  loadModel();
  let animationFrameId = null;
  let lastFrameTime = 0;
  let activeElapsedTime = 0;
  let modelRotationY = 0;
  let frameTimeAverage = 0;
  let measuredFrameCount = 0;
  let lastMainRenderCalls = 0;

  function shouldRender() {
    return heroVisible && documentActive && windowFocused && !isDisposed;
  }

  function animate(time) {
    animationFrameId = null;
    if (!shouldRender()) return;

    const delta = lastFrameTime
      ? Math.min((time - lastFrameTime) / 1000, 1 / 30)
      : 0;
    lastFrameTime = time;
    if (delta > 0) {
      measuredFrameCount += 1;
      const frameMilliseconds = delta * 1000;
      frameTimeAverage +=
        (frameMilliseconds - frameTimeAverage) /
        Math.min(measuredFrameCount, 120);
    }
    activeElapsedTime += delta;
    const sphereScale = 0.75 + Math.sin(activeElapsedTime) * 0.005;
    glassSphereGroup.scale.setScalar(sphereScale);
    modelRotationY += delta * 0.03;
    blockHuman?.setRotationY(modelRotationY);
    blockHuman?.update(delta, activeElapsedTime);
    renderer.render(scene, camera);
    lastMainRenderCalls = renderer.info.render.calls;
    animationFrameId = requestAnimationFrame(animate);
  }

  function stopRendering() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    cancelAnimationFrame(cardParallaxFrame);
    cardParallaxFrame = 0;
    hero.getAnimations({ subtree: true }).forEach((animation) => {
      if (animation.playState !== "running") return;
      animation.pause();
      pausedHeroAnimations.add(animation);
    });
    lastFrameTime = 0;
    blockHuman?.clearPointerInteraction();
    canvas.style.visibility = "hidden";
  }

  function startRendering() {
    if (!shouldRender() || animationFrameId !== null) return;
    canvas.style.visibility = "visible";
    pausedHeroAnimations.forEach((animation) => animation.play());
    pausedHeroAnimations.clear();
    finalizeSphereReflection();
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
  }

  function syncRendering() {
    if (shouldRender()) {
      startRendering();
    } else {
      stopRendering();
    }
  }

  let resizeFrameId = 0;
  function applyResize() {
    resizeFrameId = 0;
    if (isDisposed) return;
    const width = hero.clientWidth;
    const height = hero.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, quality.pixelRatioCap),
    );
    renderer.setSize(width, height, false);

  }

  function resize() {
    if (resizeFrameId) return;
    resizeFrameId = requestAnimationFrame(applyResize);
  }

  function getPerformanceReport() {
    const particleReport = blockHuman?.getPerformanceReport() || null;
    return {
      quality: qualityName,
      renderCalls: lastMainRenderCalls || renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      simulationPassesPerFrame:
        particleReport?.simulationPassesLastFrame || 0,
      planarReflectionPassesPerFrame: 0,
      planarReflectionRenderTargets: 0,
      renderTargets: particleReport?.renderTargets || [],
      approximateTextureMemoryBytes:
        particleReport?.approximateTextureMemoryBytes || 0,
      particleCount: quality.particleCount,
      pixelRatio: renderer.getPixelRatio(),
      approximateFrameTimeMs: Number(frameTimeAverage.toFixed(2)),
      particleCollisionsEnabled:
        particleReport?.particleCollisionsEnabled || false,
      heroInsideViewport: heroVisible,
      documentVisible: documentActive,
      suspended: !shouldRender(),
      raycastTargetTriangles:
        particleReport?.raycastTargetTriangles || 0,
      particleMaterial: particleReport?.particleMaterial || null,
      innerHumanMaterial: particleReport?.innerHumanMaterial || null,
    };
  }

  if (developmentMode) window.getPerformanceReport = getPerformanceReport;

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      blockHuman?.setVisible(heroVisible);
      syncRendering();
    },
    { threshold: 0 },
  );
  intersectionObserver.observe(hero);

  function handleVisibilityChange() {
    documentActive = !document.hidden;
    syncRendering();
  }

  function handleWindowFocus() {
    windowFocused = true;
    syncRendering();
  }

  function handleWindowBlur() {
    windowFocused = false;
    syncRendering();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleWindowFocus);
  window.addEventListener("blur", handleWindowBlur);

  function disposeHero() {
    if (isDisposed) return;
    isDisposed = true;
    stopRendering();
    if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
    resizeFrameId = 0;
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleWindowFocus);
    window.removeEventListener("blur", handleWindowBlur);
    window.removeEventListener("pagehide", disposeHero);
    if (
      developmentMode &&
      window.getPerformanceReport === getPerformanceReport
    ) {
      delete window.getPerformanceReport;
    }
    sphereGeometry.dispose();
    sphereGlassMaterial.dispose();
    sphereFresnelMaterial.dispose();
    disposeSphereReflectionEnvironment(sphereReflection);
    if (backgroundTitle) {
      backgroundTitle.geometry.dispose();
      backgroundTitle.material.dispose();
    }
    studio.cycloramaGeometry.dispose();
    studio.cycloramaMaterial.dispose();
    studio.backgroundGeometry.dispose();
    studio.backgroundMaterial.dispose();
    contactShadow.mesh.geometry.dispose();
    contactShadow.material.dispose();
    contactShadow.texture.dispose();
    blockHuman?.dispose();
    environmentTarget.dispose();
    renderer.dispose();
  }

  window.addEventListener("pagehide", disposeHero);

  syncRendering();
}
