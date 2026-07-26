import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js";
import { BlockSurfaceHuman } from "./three/BlockSurfaceHuman.js";
import {
  createSphereReflectionEnvironment,
  disposeSphereReflectionEnvironment,
  updateSphereReflectionOnce,
} from "../src/environment/sphereReflectionEnvironment.js";
import {
  createContactShadowMaterial,
  createGlassSphereMaterial,
  createSphereFresnelMaterial,
  createStudioBackgroundMaterial,
  createStudioCycloramaMaterial,
} from "../src/materials/index.js";

const AIM_QUALITY_PRESETS = {
  high: {
    particleCount: 4096,
    pixelRatioCap: 1.25,
    // The approved effect already runs without particle-to-particle collisions.
    particleCollisions: false,
    collisionGrid: 64,
    collisionRebuildEvery: 1,
    simulationSubsteps: 1,
    scaleTexture: true,
    physicalMaterial: true,
    bloom: false,
  },
  medium: {
    particleCount: 4096,
    pixelRatioCap: 1.15,
    particleCollisions: false,
    collisionGrid: 32,
    collisionRebuildEvery: 2,
    simulationSubsteps: 1,
    scaleTexture: true,
    physicalMaterial: true,
    bloom: false,
  },
  low: {
    // Keep the shader-friendly 64x64 state texture, but only activate and draw
    // half of it on the touch-first automatic tier.
    particleCount: 2048,
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

const HERO_MODEL_PRESETS = {
  desktop: {
    rootScaleMultiplier: 1,
    positionX: 0,
    positionY: 0.14,
    cameraDistanceMultiplier: 1,
    occupancy: null,
  },
  mobilePortrait: {
    rootScaleMultiplier: 1.11,
    positionX: 0,
    positionY: 0,
    cameraDistanceMultiplier: 1,
    occupancy: 0.74,
  },
  largeMobilePortrait: {
    rootScaleMultiplier: 1.22,
    positionX: 0.05,
    positionY: -0.02,
    cameraDistanceMultiplier: 0.9,
    occupancy: 0.74,
  },
  mobileLandscape: {
    rootScaleMultiplier: 1.22,
    positionX: 0,
    positionY: 0,
    cameraDistanceMultiplier: 1,
    occupancy: null,
  },
  tablet: {
    rootScaleMultiplier: 1.5,
    positionX: 0,
    positionY: 0,
    cameraDistanceMultiplier: 1,
    occupancy: null,
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

function createHeroPipelineProfiler(renderer, enabled) {
  if (!enabled) return null;

  const sampleFrames = 120;
  const stageNames = [
    "pointerRaycast",
    "automaticInteraction",
    "particleVelocity",
    "particlePosition",
    "externalCollision",
    "particleCollision",
    "scaleRT",
    "mainSceneRender",
    "postProcessing",
  ];
  const countNames = [
    "setRenderTarget",
    "rendererRender",
    "renderTargetSetSize",
    "renderTargetCreations",
    "renderTargetDisposals",
  ];
  const totals = Object.fromEntries(
    [...stageNames, ...countNames].map((name) => [name, 0]),
  );
  const current = Object.fromEntries(
    [...stageNames, ...countNames].map((name) => [name, 0]),
  );
  const stageCallTotals = Object.fromEntries(
    stageNames.map((name) => [name, 0]),
  );
  const stageCallCurrent = Object.fromEntries(
    stageNames.map((name) => [name, 0]),
  );
  const lifetime = Object.fromEntries(
    countNames.map((name) => [name, 0]),
  );
  let frames = 0;
  let frameStart = 0;
  let totalFrameSubmissionTime = 0;
  let lastTable = null;
  const originalSetRenderTarget = renderer.setRenderTarget;
  const originalRender = renderer.render;

  renderer.setRenderTarget = function (...args) {
    current.setRenderTarget += 1;
    lifetime.setRenderTarget += 1;
    return originalSetRenderTarget.apply(this, args);
  };
  renderer.render = function (...args) {
    current.rendererRender += 1;
    lifetime.rendererRender += 1;
    return originalRender.apply(this, args);
  };

  function resetCurrent() {
    Object.keys(current).forEach((name) => {
      current[name] = 0;
    });
    Object.keys(stageCallCurrent).forEach((name) => {
      stageCallCurrent[name] = 0;
    });
  }

  return {
    beginFrame() {
      resetCurrent();
      frameStart = performance.now();
    },
    measure(name, callback) {
      const start = performance.now();
      try {
        return callback();
      } finally {
        current[name] += performance.now() - start;
        stageCallCurrent[name] += 1;
      }
    },
    count(name, amount = 1) {
      current[name] += amount;
      if (name in lifetime) lifetime[name] += amount;
    },
    trackRenderTarget(target) {
      current.renderTargetCreations += 1;
      lifetime.renderTargetCreations += 1;
      const originalSetSize = target.setSize;
      const originalDispose = target.dispose;
      target.setSize = function (...args) {
        current.renderTargetSetSize += 1;
        lifetime.renderTargetSetSize += 1;
        return originalSetSize.apply(this, args);
      };
      target.dispose = function (...args) {
        current.renderTargetDisposals += 1;
        lifetime.renderTargetDisposals += 1;
        return originalDispose.apply(this, args);
      };
      return target;
    },
    endFrame() {
      totalFrameSubmissionTime += performance.now() - frameStart;
      Object.keys(totals).forEach((name) => {
        totals[name] += current[name];
      });
      Object.keys(stageCallTotals).forEach((name) => {
        stageCallTotals[name] += stageCallCurrent[name];
      });
      frames += 1;
      if (frames !== sampleFrames) return;
      lastTable = [
        ...stageNames.map((stage) => ({
          stage,
          averageCpuMs: Number((totals[stage] / frames).toFixed(3)),
          averageCalls: Number(
            (stageCallTotals[stage] / frames).toFixed(3),
          ),
        })),
        {
          stage: "completeAnimationCallback",
          averageCpuMs: Number(
            (totalFrameSubmissionTime / frames).toFixed(3),
          ),
          averageCalls: 1,
        },
        ...countNames.map((stage) => ({
          stage,
          averageCpuMs: null,
          averageCalls: Number((totals[stage] / frames).toFixed(3)),
        })),
      ];
      console.info(
        `[AIM hero] ${sampleFrames}-frame CPU submission profile`,
      );
      console.table(lastTable);
      console.info(
        "[AIM hero] profile JSON",
        JSON.stringify(lastTable),
      );
    },
    getReport() {
      return {
        sampledFrames: frames,
        targetFrames: sampleFrames,
        table: lastTable,
        currentFrame: { ...current },
        currentStageCalls: { ...stageCallCurrent },
        lifetime: { ...lifetime },
      };
    },
    restore() {
      renderer.setRenderTarget = originalSetRenderTarget;
      renderer.render = originalRender;
    },
  };
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
    background,
    cyclorama,
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
const heroVisual = document.querySelector(".hero-visual");

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
  const camera = new THREE.PerspectiveCamera(
    75,
    hero.clientWidth / hero.clientHeight,
    0.1,
    1000,
  );
  const touchFirst =
    window.matchMedia("(pointer: coarse)").matches ||
    !window.matchMedia("(hover: hover)").matches;
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      // Avoid allocating a multisampled default framebuffer for the automatic
      // touch-first path. Desktop keeps the approved antialiasing.
      antialias: !touchFirst,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    canvas.style.display = "none";
    if (heroVisual) {
      heroVisual.style.background =
        "center / contain no-repeat url('./src/assets/images/aim-hero-visual.png')";
    }
    console.error(
      "[AIM Hero] WebGL renderer creation failed; static fallback active.",
      error,
    );
  }
  if (renderer) {
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  scene.background = null;
  const qualityName = selectAimQuality(renderer);
  const quality = AIM_QUALITY_PRESETS[qualityName];
  const developmentMode =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    new URLSearchParams(location.search).has("aimDebug");
  const pipelineProfiler = createHeroPipelineProfiler(
    renderer,
    developmentMode,
  );

  const mobilePixelRatioCap =
    qualityName === "medium" ? 1.15 : 1.0;
  const pixelRatioCap = touchFirst
    ? mobilePixelRatioCap
    : quality.pixelRatioCap;
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, pixelRatioCap),
  );
  function getLayoutMode() {
    if (
      window.matchMedia("(min-width: 1024px)").matches &&
      !touchFirst
    ) {
      return "desktop";
    }
    if (window.matchMedia("(min-width: 1024px)").matches) {
      return "tabletWide";
    }
    if (
      window.matchMedia(
        "(max-height: 600px) and (orientation: landscape)",
      ).matches
    ) {
      return "mobileLandscape";
    }
    if (
      window.matchMedia(
        "(min-width: 600px) and (max-width: 899px) and (orientation: portrait)",
      ).matches
    ) {
      return "largeMobilePortrait";
    }
    if (window.matchMedia("(max-width: 767px)").matches) {
      return "mobilePortrait";
    }
    return "tablet";
  }

  function syncCanvasRegion() {
    const mode = getLayoutMode();
    const target = heroVisual;
    if (target && canvas.parentElement !== target) {
      target.append(canvas);
    }
    return { mode, target: target || hero };
  }

  let layoutState = syncCanvasRegion();
  const initialVisualRect =
    layoutState.target.getBoundingClientRect();
  camera.aspect =
    Math.max(1, initialVisualRect.width) /
    Math.max(1, initialVisualRect.height);
  camera.updateProjectionMatrix();
  renderer.setSize(
    Math.round(initialVisualRect.width),
    Math.round(initialVisualRect.height),
    false,
  );
  let lastRendererWidth = Math.round(initialVisualRect.width);
  let lastRendererHeight = Math.round(initialVisualRect.height);
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
  let modelFrame = null;
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

  let sphereReflectionUpdated = false;
  let isDisposed = false;
  const initialHeroBounds = hero.getBoundingClientRect();
  let heroVisible =
    initialHeroBounds.bottom > 0 && initialHeroBounds.top < window.innerHeight;
  let documentActive = !document.hidden;
  let windowFocused = true;
  const pausedHeroAnimations = new Set();

  // Capture after the model reaches its final position.
  function finalizeSphereReflection() {
    if (
      !model ||
      sphereReflectionUpdated ||
      isDisposed ||
      !heroVisible ||
      !documentActive ||
      !windowFocused
    ) {
      return;
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

  const contactShadow = createContactShadow();
  const groundingEffects = new THREE.Group();
  groundingEffects.add(contactShadow.mesh);
  scene.add(groundingEffects);

  function loadModel() {
    const debugParameters = new URLSearchParams(window.location.search);
    const requestedInteractionMode = debugParameters.get(
      "aimInteraction",
    );
    const interactionMode =
      developmentMode &&
      ["automatic", "pointer", "off"].includes(requestedInteractionMode)
        ? requestedInteractionMode
        : "automatic";
    canvas.style.pointerEvents =
      interactionMode === "pointer" ? "auto" : "none";
    blockHuman = new BlockSurfaceHuman({
      scene,
      renderer,
      camera,
      modelUrl: "./src/assets/models/aim-human.glb",
      sdfUrl: "./src/assets/models/aim-human-sdf.bin",
      sdfMetadataUrl: "./src/assets/models/aim-human-sdf.json",
      particleCount: touchFirst ? 2048 : 4096,
      collisionUrl:
        "./src/assets/collision/floor-collision-volume.bin",
      collisionMetadataUrl:
        "./src/assets/collision/floor-collision-volume.json",
      particleCollisions: {
        // Keep the production default off: this avoids the voxel-key, bitonic
        // sort, range, neighbor-correction, and velocity-correction passes.
        enabled: false,
        quality: "off",
      },
      simulation: {
        simulationSubsteps: touchFirst ? 1 : quality.simulationSubsteps,
        mobileSimulationInterval: 1 / 30,
      },
      interaction: {
        mode: interactionMode,
        automaticMobile: {
          enabled: true,
          segmentDurationMin: 2.2,
          segmentDurationMax: 4,
          localTargetDistanceMin: 0.08,
          localTargetDistanceMax: 0.28,
          distantJumpChance: 0.08,
          viewFacingBias: 0.65,
          speedSmoothing: 10,
          allowTouchOverride: false,
        },
      },
      autoInteractionDebug: debugParameters.has("autoInteractionDebug"),
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
      visualQuality:
        touchFirst || !quality.physicalMaterial ? "mobile" : "desktop",
      performanceProfiler: pipelineProfiler,
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
        sourceModel.updateMatrixWorld(true);
        const fittedBounds = new THREE.Box3().setFromObject(sourceModel);
        modelFrame = {
          center: fittedBounds.getCenter(new THREE.Vector3()),
          size: fittedBounds.getSize(new THREE.Vector3()),
        };
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
        applyResponsiveSceneLayout(layoutState.mode);
        blockHuman.setVisible(heroVisible);
        blockHuman.startSimulation({ autoActivate: true });
        finalizeSphereReflection();
        if (developmentMode) {
          console.info("AIM block human model loaded successfully.");
          console.info("AIM hero performance", getPerformanceReport());
        }
        publishHeroDiagnosticReport();
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

  function fitMobilePortraitCamera(preset) {
    if (!modelFrame || !layoutState.target) {
      camera.position.set(0, 0.25, 0.674);
      return;
    }

    const { center, size } = modelFrame;
    const occupancy = preset.occupancy;
    const scaleMultiplier = preset.rootScaleMultiplier;
    const scaledCenterX =
      center.x * scaleMultiplier + preset.positionX;
    const scaledCenterY =
      center.y * scaleMultiplier + preset.positionY;
    const scaledCenterZ = center.z * scaleMultiplier;
    const scaledWidth = size.x * scaleMultiplier;
    const scaledHeight = size.y * scaleMultiplier;
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov =
      2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const verticalDistance =
      scaledHeight / (2 * Math.tan(verticalFov / 2) * occupancy);
    const horizontalDistance =
      scaledWidth / (2 * Math.tan(horizontalFov / 2) * 0.72);
    const distance =
      Math.max(verticalDistance, horizontalDistance) *
      preset.cameraDistanceMultiplier;

    // A small right/down composition bias leaves room for particle activity.
    camera.position.set(
      scaledCenterX - scaledWidth * 0.05,
      scaledCenterY + scaledHeight * 0.08,
      scaledCenterZ + distance,
    );
  }

  function fitDesktopCameraToVisualRegion() {
    if (!modelFrame || !layoutState.target) {
      camera.position.set(-0.2, 0.35, 0.7);
      return;
    }
    const heroRect = hero.getBoundingClientRect();
    const visualRect = layoutState.target.getBoundingClientRect();
    if (
      heroRect.width < 2 ||
      heroRect.height < 2 ||
      visualRect.width < 2 ||
      visualRect.height < 2
    ) {
      return;
    }

    const center = modelFrame.center;
    const baseX = -0.2;
    const baseY = 0.35;
    const baseZ = 0.7;
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const oldDepth = Math.max(0.001, baseZ - center.z);
    const oldAspect = heroRect.width / heroRect.height;
    const oldNdcX =
      (center.x - baseX) / (oldDepth * tangent * oldAspect);
    const oldNdcY = (center.y - baseY) / (oldDepth * tangent);
    const approvedScreenX =
      heroRect.left + (oldNdcX + 1) * heroRect.width * 0.5;
    const approvedScreenY =
      heroRect.top + (1 - oldNdcY) * heroRect.height * 0.5;

    // Scaling the camera-to-model vector by the drawing-height ratio keeps
    // the model's projected pixel height unchanged.
    const distanceScale = visualRect.height / heroRect.height;
    camera.position.set(
      center.x + (baseX - center.x) * distanceScale,
      center.y + (baseY - center.y) * distanceScale,
      center.z + (baseZ - center.z) * distanceScale,
    );

    const newDepth = Math.max(0.001, camera.position.z - center.z);
    const newNdcX =
      (center.x - camera.position.x) /
      (newDepth * tangent * camera.aspect);
    const newNdcY =
      (center.y - camera.position.y) / (newDepth * tangent);
    const currentScreenX =
      visualRect.left + (newNdcX + 1) * visualRect.width * 0.5;
    const currentScreenY =
      visualRect.top + (1 - newNdcY) * visualRect.height * 0.5;
    const worldUnitsPerPixel =
      (2 * newDepth * tangent) / visualRect.height;
    camera.position.x +=
      (currentScreenX - approvedScreenX) * worldUnitsPerPixel;
    camera.position.y -=
      (currentScreenY - approvedScreenY) * worldUnitsPerPixel;

    // The old full-hero projection can sit partly outside the reduced visual
    // region. Clamp the complete metallic-human bounds into the canvas while
    // retaining a little room for particle motion.
    const halfWidth = modelFrame.size.x * 0.5;
    const halfDepth = modelFrame.size.z * 0.5;
    const boundsCenterX = modelFrame.center.x;
    const boundsCenterZ = modelFrame.center.z;
    let projectedMinX = Infinity;
    let projectedMaxX = -Infinity;
    for (let xSide = -1; xSide <= 1; xSide += 2) {
      for (let zSide = -1; zSide <= 1; zSide += 2) {
        const pointX = boundsCenterX + halfWidth * xSide;
        const pointZ = boundsCenterZ + halfDepth * zSide;
        const pointDepth = Math.max(
          0.001,
          camera.position.z - pointZ,
        );
        const ndcX =
          (pointX - camera.position.x) /
          (pointDepth * tangent * camera.aspect);
        const pixelX = (ndcX + 1) * visualRect.width * 0.5;
        projectedMinX = Math.min(projectedMinX, pixelX);
        projectedMaxX = Math.max(projectedMaxX, pixelX);
      }
    }
    const horizontalPadding = 32;
    if (projectedMinX < horizontalPadding) {
      camera.position.x -=
        (horizontalPadding - projectedMinX) * worldUnitsPerPixel;
    } else if (
      projectedMaxX >
      visualRect.width - horizontalPadding
    ) {
      camera.position.x +=
        (
          projectedMaxX -
          (visualRect.width - horizontalPadding)
        ) * worldUnitsPerPixel;
    }
  }

  function applyResponsiveSceneLayout(mode) {
    const preset = HERO_MODEL_PRESETS[mode] || HERO_MODEL_PRESETS.tablet;
    if (blockHuman?.sourceRoot) {
      blockHuman.setVisualTransform({
        scaleMultiplier: preset.rootScaleMultiplier,
        positionX: preset.positionX,
        positionY: preset.positionY,
      });
    }
    // The opaque clip-space studio quad exposes the reduced canvas boundary.
    // The DOM hero owns the background; WebGL stays transparent.
    studio.background.visible = false;
    // The opaque cyclorama also fills the reduced viewport on some GPUs,
    // exposing the canvas as a black rectangle. Image-based lighting remains
    // available through scene.environment.
    studio.cyclorama.visible = false;
    if (mode === "desktop") {
      fitDesktopCameraToVisualRegion();
    } else if (
      mode === "mobilePortrait" ||
      mode === "largeMobilePortrait"
    ) {
      fitMobilePortraitCamera(preset);
    } else if (mode === "mobileLandscape") {
      camera.position.set(0.1, 0.31, 0.826);
    } else {
      camera.position.set(0.03, 0.31, 0.77);
    }
    camera.updateProjectionMatrix();
  }

  applyResponsiveSceneLayout(layoutState.mode);

  loadModel();
  let animationFrameId = null;
  let lastFrameTime = 0;
  let activeElapsedTime = 0;
  let modelRotationY = 0;
  let frameTimeAverage = 0;
  let measuredFrameCount = 0;
  let lastMainRenderCalls = 0;
  let mainRenderCount = 0;
  const renderRateStartedAt = performance.now();
  const mainRenderPreviousClearColor = new THREE.Color();

  function shouldRender() {
    const state = getRenderState();
    return (
      state.heroVisible &&
      state.documentVisible &&
      state.rendererReady &&
      state.containerHasSize &&
      state.contextAvailable &&
      !state.suspended
    );
  }

  function getRenderState() {
    const targetRect = layoutState.target.getBoundingClientRect();
    return {
      heroVisible,
      documentVisible: documentActive,
      rendererReady: Boolean(renderer),
      containerHasSize: targetRect.width >= 2 && targetRect.height >= 2,
      contextAvailable: !renderer.getContext().isContextLost(),
      suspended: isDisposed || !windowFocused,
    };
  }

  function renderMainScene() {
    renderer.getClearColor(mainRenderPreviousClearColor);
    const previousClearAlpha = renderer.getClearAlpha();
    const previousAutoClear = renderer.autoClear;
    const previousRenderTarget = renderer.getRenderTarget();
    try {
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.autoClear = false;
      renderer.render(scene, camera);
    } finally {
      renderer.autoClear = previousAutoClear;
      renderer.setClearColor(
        mainRenderPreviousClearColor,
        previousClearAlpha,
      );
      renderer.setRenderTarget(previousRenderTarget);
    }
  }

  function animate(time) {
    animationFrameId = null;
    if (!shouldRender()) return;
    const profilingFrame =
      pipelineProfiler && blockHuman?.simulationInitialized;
    profilingFrame && pipelineProfiler.beginFrame();

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
    if (blockHuman?.particleSystemAvailable) {
      try {
        blockHuman.update(delta, activeElapsedTime);
      } catch (error) {
        blockHuman.disableParticleSystem(error);
        console.error(
          "[AIM Hero] Particle runtime failed; metallic fallback active.",
          error,
        );
      }
    }
    if (pipelineProfiler) {
      pipelineProfiler.measure("mainSceneRender", () => {
        renderMainScene();
      });
    } else {
      renderMainScene();
    }
    lastMainRenderCalls = renderer.info.render.calls;
    mainRenderCount += 1;
    profilingFrame && pipelineProfiler.endFrame();
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
    layoutState = syncCanvasRegion();
    const visualRect = layoutState.target.getBoundingClientRect();
    const width = Math.max(1, Math.round(visualRect.width));
    const height = Math.max(1, Math.round(visualRect.height));
    if (width < 2 || height < 2) return;

    const nextPixelRatio = Math.min(
      window.devicePixelRatio,
      pixelRatioCap,
    );
    const pixelRatioChanged =
      renderer.getPixelRatio() !== nextPixelRatio;
    if (
      width !== lastRendererWidth ||
      height !== lastRendererHeight ||
      pixelRatioChanged
    ) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(nextPixelRatio);
      renderer.setSize(width, height, false);
      lastRendererWidth = width;
      lastRendererHeight = height;
    }
    applyResponsiveSceneLayout(layoutState.mode);
  }

  function resize() {
    if (resizeFrameId) return;
    resizeFrameId = requestAnimationFrame(applyResize);
  }

  function getPerformanceReport() {
    const particleReport = blockHuman?.getPerformanceReport() || null;
    const renderRateSeconds = Math.max(
      (performance.now() - renderRateStartedAt) / 1000,
      0.001,
    );
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
      particleCount: particleReport?.particleCount || quality.particleCount,
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
      interactionRates: particleReport?.interactionRates || null,
      mainRendersPerSecond: Number(
        (mainRenderCount / renderRateSeconds).toFixed(2),
      ),
      pipelineProfile: pipelineProfiler?.getReport() || null,
    };
  }

  let diagnosticPublished = false;
  function getProjectedHumanBounds() {
    if (!blockHuman?.sourceRoot || !layoutState.target) return null;
    blockHuman.visualRoot.updateWorldMatrix(true, true);
    camera.updateMatrixWorld();
    const bounds = new THREE.Box3().setFromObject(blockHuman.sourceRoot);
    if (bounds.isEmpty()) return null;
    const minimum = bounds.min;
    const maximum = bounds.max;
    const projected = new THREE.Vector3();
    let minX = 1;
    let minY = 1;
    let maxX = -1;
    let maxY = -1;
    for (let corner = 0; corner < 8; corner += 1) {
      projected
        .set(
          corner & 1 ? maximum.x : minimum.x,
          corner & 2 ? maximum.y : minimum.y,
          corner & 4 ? maximum.z : minimum.z,
        )
        .project(camera);
      minX = Math.min(minX, projected.x);
      minY = Math.min(minY, projected.y);
      maxX = Math.max(maxX, projected.x);
      maxY = Math.max(maxY, projected.y);
    }
    const rect = layoutState.target.getBoundingClientRect();
    const left = THREE.MathUtils.clamp((minX + 1) * 0.5, 0, 1);
    const right = THREE.MathUtils.clamp((maxX + 1) * 0.5, 0, 1);
    const top = THREE.MathUtils.clamp((1 - maxY) * 0.5, 0, 1);
    const bottom = THREE.MathUtils.clamp((1 - minY) * 0.5, 0, 1);
    const width = Math.max(0, right - left) * rect.width;
    const height = Math.max(0, bottom - top) * rect.height;
    return {
      left: Math.round(left * rect.width),
      top: Math.round(top * rect.height),
      width: Math.round(width),
      height: Math.round(height),
      canvasCoveragePercent: Number(
        ((width * height * 100) / (rect.width * rect.height)).toFixed(2),
      ),
      coverageMethod: "projected human bounding-box proxy",
    };
  }

  function getHeroDiagnosticReport() {
    const gl = renderer.getContext();
    const visualRect = layoutState.target.getBoundingClientRect();
    const root = blockHuman?.visualRoot;
    const capabilities = renderer.capabilities;
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      visualContainer: {
        width: Math.round(visualRect.width),
        height: Math.round(visualRect.height),
      },
      devicePixelRatio: window.devicePixelRatio,
      responsivePreset: layoutState.mode,
      qualityTier: blockHuman?.particleSystemAvailable
        ? qualityName
        : "ipad-fallback",
      interactionMode: blockHuman?.resolvedInteractionMode || null,
      webglVersion: capabilities.isWebGL2 ? 2 : 1,
      capabilities: {
        maxTextureSize: capabilities.maxTextureSize,
        maxVertexTextures: capabilities.maxVertexTextures,
        floatTexture: Boolean(
          capabilities.isWebGL2 ||
          renderer.extensions.has("OES_texture_float"),
        ),
        halfFloatTexture: Boolean(
          capabilities.isWebGL2 ||
          renderer.extensions.has("OES_texture_half_float"),
        ),
        colorBufferFloat: renderer.extensions.has(
          "EXT_color_buffer_float",
        ),
        colorBufferHalfFloat: renderer.extensions.has(
          "EXT_color_buffer_half_float",
        ),
        simulationInternalFormat:
          blockHuman?.simulationInternalFormat || null,
      },
      modelLoaded: Boolean(blockHuman?.sourceRoot),
      particleSystemInitialized: Boolean(
        blockHuman?.simulationInitialized,
      ),
      particleInitializationError:
        blockHuman?.particleInitializationError?.message || null,
      canvas: { width: canvas.width, height: canvas.height },
      camera: {
        aspect: camera.aspect,
        near: camera.near,
        far: camera.far,
      },
      commonRoot: root
        ? {
            scale: root.scale.toArray(),
            position: root.position.toArray(),
          }
        : null,
      projectedHumanBounds: getProjectedHumanBounds(),
      shouldRender: shouldRender(),
      renderState: getRenderState(),
      heroIntersectionObserverState: heroVisible,
      documentVisibilityState: document.visibilityState,
    };
  }

  function publishHeroDiagnosticReport() {
    if (!developmentMode || diagnosticPublished) return;
    diagnosticPublished = true;
    const report = getHeroDiagnosticReport();
    window.__AIM_HERO_DEBUG__ = report;
    console.info("[AIM Hero] Initialization diagnostics", report);
  }

  if (developmentMode) window.getPerformanceReport = getPerformanceReport;

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);
  if (heroVisual) resizeObserver.observe(heroVisual);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      blockHuman?.setVisible(heroVisible);
      syncRendering();
    },
    { threshold: 0 },
  );
  intersectionObserver.observe(hero);

  function showStaticFallback() {
    canvas.style.visibility = "hidden";
    if (heroVisual) {
      heroVisual.style.background =
        "center / contain no-repeat url('./src/assets/images/aim-hero-visual.png')";
    }
  }

  function handleContextLost() {
    stopRendering();
    showStaticFallback();
    console.error("[AIM Hero] WebGL context lost; static fallback active.");
  }

  function handleContextRestored() {
    if (heroVisual) heroVisual.style.background = "";
    canvas.style.visibility = "visible";
    console.info("[AIM Hero] WebGL context restored.");
    syncRendering();
  }

  canvas.addEventListener("webglcontextlost", handleContextLost, false);
  canvas.addEventListener(
    "webglcontextrestored",
    handleContextRestored,
    false,
  );

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
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    canvas.removeEventListener(
      "webglcontextrestored",
      handleContextRestored,
    );
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
    studio.cycloramaGeometry.dispose();
    studio.cycloramaMaterial.dispose();
    studio.backgroundGeometry.dispose();
    studio.backgroundMaterial.dispose();
    contactShadow.mesh.geometry.dispose();
    contactShadow.material.dispose();
    contactShadow.texture.dispose();
    blockHuman?.dispose();
    environmentTarget.dispose();
    pipelineProfiler?.restore();
    renderer.dispose();
  }

  window.addEventListener("pagehide", disposeHero);

  syncRendering();
  }
}
