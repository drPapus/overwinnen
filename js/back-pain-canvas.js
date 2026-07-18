import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js";

console.log("[Back Pain Spine] script loaded");

const DEBUG_SPINE_VIEWS = false;
const SPINE_LIGHTING = {
  exposure: 0.75,
  keyIntensity: 3,
  rimIntensity: 2.2,
  fillIntensity: 0.4,
  lowerFillIntensity: 1,
  envMapIntensity: 1.25,
  opacity: 0.72,
};

const canvas = document.querySelector("#backPainCanvas");
const modelUrl = new URL(
  "../src/assets/models/the_human_spinal_column.glb",
  import.meta.url,
).href;

console.log("[Back Pain Spine] canvas found:", Boolean(canvas));
console.log("[Back Pain Spine] Three revision:", THREE.REVISION);
console.log("[Back Pain Spine] model URL:", modelUrl);

if (canvas && document.body.classList.contains("page-back-pain")) {
  let webglAvailable = false;

  try {
    const testCanvas = document.createElement("canvas");
    const gl =
      testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");

    webglAvailable = Boolean(gl);
    if (!gl) console.warn("[Back Pain Spine] WebGL is unavailable");
  } catch (error) {
    console.error("[Back Pain Spine] WebGL check failed", error);
  }

  if (webglAvailable) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.debug.checkShaderErrors = true;
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = SPINE_LIGHTING.exposure;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnvironment = new RoomEnvironment();
    const environmentTarget = pmremGenerator.fromScene(roomEnvironment, 0.04);
    const environmentTexture = environmentTarget.texture;
    scene.environment = environmentTexture;
    roomEnvironment.dispose();
    pmremGenerator.dispose();

    const spineLayoutGroup = new THREE.Group();
    const spineRotationGroup = new THREE.Group();
    const spineNormalizationGroup = new THREE.Group();
    spineLayoutGroup.add(spineRotationGroup);
    spineRotationGroup.add(spineNormalizationGroup);
    scene.add(spineLayoutGroup);

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const spineViews = {
      overview: {
        modelPosition: { x: 1.9, y: -0.15, z: 0 },
        modelRotation: { x: 0.02, y: -0.5, z: 0.01 },
        modelScale: 1,
        cameraPosition: { x: 0, y: 0, z: 7.2 },
        cameraTarget: { x: 0.8, y: 0, z: 0 },
      },
      symptoms: {
        modelPosition: { x: 1.55, y: 0.1, z: 0.15 },
        modelRotation: { x: 0, y: -4.25, z: -0.01 },
        modelScale: 2.08,
        cameraPosition: { x: 0, y: 0.15, z: 6.5 },
        cameraTarget: { x: 0.9, y: 0.15, z: 0 },
      },
      cervical: {
        modelPosition: { x: 1.45, y: -1.15, z: 0.3 },
        modelRotation: { x: 0.03, y: -3.1, z: 0 },
        modelScale: 3.55,
        cameraPosition: { x: 0, y: 0.7, z: 5.8 },
        cameraTarget: { x: 0.8, y: 1.3, z: 0 },
      },
      thoracic: {
        modelPosition: { x: 1.45, y: -0.25, z: 0.2 },
        modelRotation: { x: 0, y: 0.15, z: 0.01 },
        modelScale: 2.35,
        cameraPosition: { x: 0, y: 0.15, z: 6.1 },
        cameraTarget: { x: 0.8, y: 0.2, z: 0 },
      },
      lumbar: {
        modelPosition: { x: 1.45, y: 1.05, z: 0.25 },
        modelRotation: { x: -0.01, y: 0.35, z: 0 },
        modelScale: 1,
        cameraPosition: { x: 0, y: -0.55, z: 5.8 },
        cameraTarget: { x: 0.8, y: -1, z: 0 },
      },
      assessment: {
        modelPosition: { x: 4.75, y: 0.25, z: 0 },
        modelRotation: { x: 0.02, y: 0.55, z: -0.01 },
        modelScale: 0.68,
        cameraPosition: { x: 6, y: 0, z: 6.8 },
        cameraTarget: { x: 0.9, y: -0.1, z: 0 },
      },
      recovery: {
        modelPosition: { x: 2, y: -0.2, z: -0.1 },
        modelRotation: { x: 0.02, y: 0.75, z: 0 },
        modelScale: 0.05,
        cameraPosition: { x: 0, y: 0, z: 7.5 },
        cameraTarget: { x: 0.9, y: 0, z: 0 },
      },
    };
    const sectionViewSelectors = [
      ["overview", "#back-title"],
      ["symptoms", "#experiences-title"],
      ["cervical", "#safety-title"],
      ["thoracic", "#assessment-title"],
      ["lumbar", "#process-title"],
      ["assessment", "#progression-title"],
      ["recovery", "#final-title"],
    ];
    let spineViewSections = [];
    let lastScrollTime = 0;
    let viewStateInitialized = false;
    const targetModelPosition = new THREE.Vector3();
    const currentModelPosition = new THREE.Vector3();
    const targetModelRotation = new THREE.Vector3();
    const currentModelRotation = new THREE.Vector3();
    const targetCameraPosition = new THREE.Vector3();
    const currentCameraPosition = new THREE.Vector3();
    const targetCameraTarget = new THREE.Vector3();
    const currentCameraTarget = new THREE.Vector3();
    let targetModelScale = 1;
    let currentModelScale = 1;

    const spineMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x151b22,
      roughness: 0.2,
      metalness: 0.72,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      transparent: true,
      opacity: 0,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      envMapIntensity: SPINE_LIGHTING.envMapIntensity,
    });
    const targetOpacity = SPINE_LIGHTING.opacity;
    let currentOpacity = 0;
    let spineLoaded = false;

    const keyLight = new THREE.DirectionalLight(
      0xd9f7ff,
      SPINE_LIGHTING.keyIntensity,
    );
    const rimLight = new THREE.DirectionalLight(
      0x55d8ee,
      SPINE_LIGHTING.rimIntensity,
    );
    const fillLight = new THREE.HemisphereLight(
      0xa9eaff,
      0x050a10,
      SPINE_LIGHTING.fillIntensity,
    );
    const lowerFillLight = new THREE.PointLight(
      0x4faec2,
      SPINE_LIGHTING.lowerFillIntensity,
      14,
      2,
    );
    keyLight.position.set(4, 5, 6);
    rimLight.position.set(-4, 2, -5);
    lowerFillLight.position.set(2, -3, 3);
    scene.add(keyLight, rimLight, fillLight, lowerFillLight);

    function hierarchyName(object, root) {
      const names = [];
      let current = object;
      while (current && current !== root) {
        if (current.name) names.push(current.name);
        current = current.parent;
      }
      return names.join("/");
    }

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const spineModel = gltf.scene;
        const annotationMeshes = [];
        const importedMaterials = new Set();

        spineModel.traverse((child) => {
          if (!child.isMesh) return;

          const meshPath = hierarchyName(child, spineModel);
          console.log("[Back Pain Spine] mesh:", meshPath || child.name);
          child.castShadow = false;
          child.receiveShadow = false;
          if (
            child.geometry?.attributes?.position &&
            !child.geometry.attributes.normal
          ) {
            child.geometry.computeVertexNormals();
          }
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((material) => material && importedMaterials.add(material));

          // The source file includes diagram labels and marker cylinders in
          // addition to anatomy. Keep those out of the model bounds and view.
          if (/(text\d*|labels|marker|cylinder\d*)/i.test(meshPath)) {
            annotationMeshes.push(child);
            return;
          }

          child.material = spineMaterial;
        });
        annotationMeshes.forEach((mesh) => mesh.removeFromParent());
        importedMaterials.forEach((material) => material.dispose());

        const box = new THREE.Box3().setFromObject(spineModel);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const targetHeight = 4.2;
        const normalizationScale = targetHeight / Math.max(size.y, 0.001);
        spineModel.position.sub(center);
        spineNormalizationGroup.scale.setScalar(normalizationScale);
        spineNormalizationGroup.add(spineModel);

        spineLoaded = true;

        console.log("[Back Pain Spine] model loaded");
        console.log("[Back Pain Spine] original size:", size);
        console.log(
          "[Back Pain Spine] normalization scale:",
          normalizationScale,
        );
      },
      (event) => {
        if (!event.total) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        console.log(`[Back Pain Spine] loading: ${progress}%`);
      },
      (error) => {
        console.error("[Back Pain Spine] failed to load model", error);
      },
    );

    function lerpNumber(from, to, amount) {
      return THREE.MathUtils.lerp(from, to, amount);
    }

    function lerpObjectVector(from, to, amount) {
      return {
        x: lerpNumber(from.x, to.x, amount),
        y: lerpNumber(from.y, to.y, amount),
        z: lerpNumber(from.z, to.z, amount),
      };
    }

    function collectSpineViewSections() {
      spineViewSections = sectionViewSelectors
        .map(([name, selector]) => {
          const section = document.querySelector(selector)?.closest("section");
          if (!section) return null;
          section.dataset.spineView = name;
          const rect = section.getBoundingClientRect();
          return {
            name,
            center: window.scrollY + rect.top + rect.height * 0.5,
          };
        })
        .filter(Boolean);
    }

    function getSectionViewBlend() {
      const viewportCenter = window.scrollY + window.innerHeight * 0.5;
      const sections = spineViewSections;
      if (!sections.length) return { from: "overview", to: "overview", amount: 0 };
      if (viewportCenter <= sections[0].center) {
        return { from: sections[0].name, to: sections[0].name, amount: 0 };
      }

      const last = sections[sections.length - 1];
      if (viewportCenter >= last.center) {
        return { from: last.name, to: last.name, amount: 0 };
      }

      for (let index = 0; index < sections.length - 1; index += 1) {
        const previous = sections[index];
        const next = sections[index + 1];
        if (viewportCenter < previous.center || viewportCenter > next.center) continue;
        const range = next.center - previous.center;
        const localProgress = range > 0
          ? (viewportCenter - previous.center) / range
          : 0;
        return {
          from: previous.name,
          to: next.name,
          amount: THREE.MathUtils.smoothstep(localProgress, 0, 1),
        };
      }

      return { from: "overview", to: "overview", amount: 0 };
    }

    function getResponsiveView(view) {
      const width = window.innerWidth;
      if (width < 768) {
        const mobileScale = THREE.MathUtils.clamp(view.modelScale * 0.72, 0.75, 1.05);
        return {
          modelPosition: {
            x: 0.68 + (view.modelPosition.x - 1.6) * 0.4,
            y: -0.3 + view.modelPosition.y * 0.5,
            z: view.modelPosition.z * 0.4,
          },
          modelRotation: {
            x: view.modelRotation.x * 0.4,
            y: view.modelRotation.y * 0.4,
            z: view.modelRotation.z * 0.4,
          },
          modelScale: mobileScale,
          cameraPosition: {
            x: 0,
            y: view.cameraPosition.y * 0.15,
            z: THREE.MathUtils.clamp(
              lerpNumber(7.2, view.cameraPosition.z, 0.22),
              6.8,
              7.5,
            ),
          },
          cameraTarget: { x: 0.48, y: 0, z: 0 },
        };
      }

      if (width <= 1024) {
        return {
          modelPosition: {
            x: 1.35 + (view.modelPosition.x - 1.6) * 0.8,
            y: -0.1 + view.modelPosition.y * 0.75,
            z: view.modelPosition.z * 0.75,
          },
          modelRotation: {
            x: view.modelRotation.x * 0.8,
            y: view.modelRotation.y * 0.8,
            z: view.modelRotation.z * 0.8,
          },
          modelScale: THREE.MathUtils.clamp(view.modelScale * 0.85, 0.8, 1.4),
          cameraPosition: {
            x: view.cameraPosition.x,
            y: view.cameraPosition.y * 0.6,
            z: lerpNumber(7.2, view.cameraPosition.z, 0.65),
          },
          cameraTarget: {
            x: 0.72 + (view.cameraTarget.x - 0.8) * 0.6,
            y: view.cameraTarget.y * 0.6,
            z: view.cameraTarget.z,
          },
        };
      }

      return view;
    }

    function updateViewTargets() {
      const blend = reduceMotionQuery.matches
        ? { from: "overview", to: "overview", amount: 0 }
        : getSectionViewBlend();
      const from = getResponsiveView(spineViews[blend.from]);
      const to = getResponsiveView(spineViews[blend.to]);
      const amount = blend.amount;
      const position = lerpObjectVector(from.modelPosition, to.modelPosition, amount);
      const rotation = lerpObjectVector(from.modelRotation, to.modelRotation, amount);
      const cameraPosition = lerpObjectVector(
        from.cameraPosition,
        to.cameraPosition,
        amount,
      );
      const cameraTarget = lerpObjectVector(from.cameraTarget, to.cameraTarget, amount);

      targetModelPosition.set(position.x, position.y, position.z);
      targetModelRotation.set(rotation.x, rotation.y, rotation.z);
      targetModelScale = THREE.MathUtils.clamp(
        lerpNumber(from.modelScale, to.modelScale, amount),
        0.75,
        1.65,
      );
      targetCameraPosition.set(
        cameraPosition.x,
        cameraPosition.y,
        THREE.MathUtils.clamp(cameraPosition.z, 5.5, 8),
      );
      targetCameraTarget.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);

      if (!viewStateInitialized) {
        currentModelPosition.copy(targetModelPosition);
        currentModelRotation.copy(targetModelRotation);
        currentModelScale = targetModelScale;
        currentCameraPosition.copy(targetCameraPosition);
        currentCameraTarget.copy(targetCameraTarget);
        viewStateInitialized = true;
      }

      if (DEBUG_SPINE_VIEWS) {
        console.info("[Back Pain Spine] view", blend.from, blend.to, amount);
      }
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const lightMultiplier = width < 768 ? 0.78 : width <= 1024 ? 0.9 : 1;

      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, width < 768 ? 1 : 1.5),
      );
      renderer.setSize(width, height, false);
      keyLight.intensity = SPINE_LIGHTING.keyIntensity * lightMultiplier;
      rimLight.intensity = SPINE_LIGHTING.rimIntensity * lightMultiplier;
      fillLight.intensity = SPINE_LIGHTING.fillIntensity * lightMultiplier;
      lowerFillLight.intensity =
        SPINE_LIGHTING.lowerFillIntensity * lightMultiplier;
      spineMaterial.envMapIntensity =
        SPINE_LIGHTING.envMapIntensity * (width < 768 ? 0.68 : lightMultiplier);
      collectSpineViewSections();
      updateViewTargets();
    }

    const clock = new THREE.Clock();
    let animationFrame = 0;

    function animate() {
      const elapsedTime = clock.getElapsedTime();

      if (spineLoaded) {
        currentModelPosition.lerp(targetModelPosition, 0.06);
        currentModelRotation.lerp(targetModelRotation, 0.06);
        currentModelScale += (targetModelScale - currentModelScale) * 0.06;
        currentCameraPosition.lerp(targetCameraPosition, 0.05);
        currentCameraTarget.lerp(targetCameraTarget, 0.05);

        const idleEnabled =
          window.innerWidth >= 768 &&
          !reduceMotionQuery.matches &&
          performance.now() - lastScrollTime > 180;
        const idleY = idleEnabled ? Math.sin(elapsedTime * 0.35) * 0.018 : 0;
        const idleRotation = idleEnabled
          ? Math.sin(elapsedTime * 0.22) * 0.008
          : 0;

        spineLayoutGroup.position.copy(currentModelPosition);
        spineLayoutGroup.position.y += idleY;
        spineLayoutGroup.scale.setScalar(currentModelScale);
        spineRotationGroup.rotation.set(
          currentModelRotation.x,
          currentModelRotation.y + idleRotation,
          currentModelRotation.z,
        );
        camera.position.copy(currentCameraPosition);
        camera.lookAt(currentCameraTarget);

        const responsiveOpacity =
          window.innerWidth < 768
            ? 0.48
            : window.innerWidth <= 1024
              ? 0.62
              : targetOpacity;
        currentOpacity += (responsiveOpacity - currentOpacity) * 0.05;
        spineMaterial.opacity = currentOpacity;
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    }

    function handleScroll() {
      lastScrollTime = performance.now();
      updateViewTargets();
    }

    function destroy() {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", resize);
      reduceMotionQuery.removeEventListener("change", updateViewTargets);
      scene.environment = null;
      environmentTexture.dispose();
      environmentTarget.dispose();
      spineMaterial.dispose();
      renderer.dispose();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener(
      "load",
      () => {
        collectSpineViewSections();
        updateViewTargets();
      },
      { once: true },
    );
    reduceMotionQuery.addEventListener("change", updateViewTargets);
    window.addEventListener("pagehide", destroy, { once: true });
    resize();
    animate();
  }
}
