import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js";

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

export class AnatomyCanvas {
  constructor(config) {
    this.config = config;
    this.canvas = typeof config.canvas === "string"
      ? document.querySelector(config.canvas)
      : config.canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.modelLoaded = false;
    this.destroyed = false;
    this.visible = true;
    this.tabVisible = !document.hidden;
    this.frame = 0;
    this.resizeFrame = 0;
    this.lastScrollTime = 0;
    this.sections = [];
    this.current = null;
    this.target = null;
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.clock = new THREE.Clock();
    this.boundResize = () => this.queueResize();
    this.boundScroll = () => this.handleScroll();
    this.boundVisibility = () => this.handleVisibility();
    this.boundMotion = () => this.handleMotionPreference();
  }

  init() {
    if (!this.canvas || this.destroyed) return this;
    this.canvas.classList.add("anatomy-canvas--loading");
    if (!this.hasWebGL()) {
      this.setCanvasState("error");
      return this;
    }
    this.createScene();
    this.createEnvironment();
    this.createMaterial();
    this.createLights();
    this.createModelGroups();
    this.bindEvents();
    this.resize();
    this.loadModel();
    this.requestRender();
    return this;
  }

  hasWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch (error) {
      console.error(`[AnatomyCanvas:${this.config.modelName}] WebGL check failed`, error);
      return false;
    }
  }

  createScene() {
    const { fov = 45, near = 0.1, far = 100, lighting = {} } = this.config;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = lighting.exposure ?? 0.75;
  }

  createEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    const room = new RoomEnvironment();
    this.environmentTarget = pmrem.fromScene(room, 0.04);
    this.environmentTexture = this.environmentTarget.texture;
    this.scene.environment = this.environmentTexture;
    room.dispose();
    pmrem.dispose();
  }

  createMaterial() {
    const material = this.config.material || {};
    if (material.mode === "original") {
      this.sharedMaterial = null;
      return;
    }
    this.sharedMaterial = new THREE.MeshPhysicalMaterial({
      color: material.color ?? 0x151b22,
      roughness: material.roughness ?? 0.2,
      metalness: material.metalness ?? 0.72,
      clearcoat: material.clearcoat ?? 0.55,
      clearcoatRoughness: material.clearcoatRoughness ?? 0.18,
      transmission: material.mode === "crystal" ? (material.transmission ?? 0.12) : (material.transmission ?? 0),
      thickness: material.thickness ?? 0.7,
      transparent: true,
      opacity: 0,
      depthWrite: true,
      depthTest: true,
      side: material.side === "double" ? THREE.DoubleSide : THREE.FrontSide,
      envMapIntensity: material.envMapIntensity ?? 1.25,
    });
    this.targetOpacity = material.opacity ?? 0.72;
    this.currentOpacity = 0;
  }

  createLights() {
    const light = this.config.lighting || {};
    this.keyLight = new THREE.DirectionalLight(light.keyColor ?? 0xd9f7ff, light.keyIntensity ?? 3);
    this.rimLight = new THREE.DirectionalLight(light.rimColor ?? 0x55d8ee, light.rimIntensity ?? 2.2);
    this.fillLight = new THREE.HemisphereLight(light.fillSkyColor ?? 0xa9eaff, light.fillGroundColor ?? 0x050a10, light.fillIntensity ?? 0.4);
    this.pointLight = new THREE.PointLight(light.pointColor ?? 0x4faec2, light.pointIntensity ?? 1, 14, 2);
    this.keyLight.position.set(4, 5, 6);
    this.rimLight.position.set(-4, 2, -5);
    this.pointLight.position.set(2, -3, 3);
    this.scene.add(this.keyLight, this.rimLight, this.fillLight, this.pointLight);
  }

  createModelGroups() {
    this.layoutGroup = new THREE.Group();
    this.rotationGroup = new THREE.Group();
    this.normalizationGroup = new THREE.Group();
    this.layoutGroup.add(this.rotationGroup);
    this.rotationGroup.add(this.normalizationGroup);
    this.scene.add(this.layoutGroup);
  }

  async loadModel() {
    const loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/gltf/");
    loader.setDRACOLoader(this.dracoLoader);
    try {
      const gltf = await loader.loadAsync(this.config.modelUrl);
      if (this.destroyed) return;
      this.model = gltf.scene;
      this.prepareModel(this.model);
      this.modelLoaded = true;
      this.setCanvasState("ready");
      console.info(`[AnatomyCanvas:${this.config.modelName}] model loaded`);
      this.requestRender();
    } catch (error) {
      this.setCanvasState("error");
      console.error(`[AnatomyCanvas:${this.config.modelName}] failed to load model`, error);
    }
  }

  prepareModel(model) {
    const imported = new Set();
    const remove = [];
    model.traverse((child) => {
      if (!child.isMesh) return;
      const path = this.hierarchyName(child, model);
      if (this.config.removeMeshesMatching?.test(path)) {
        remove.push(child);
        return;
      }
      child.castShadow = false;
      child.receiveShadow = false;
      if (child.geometry?.attributes?.position && !child.geometry.attributes.normal) child.geometry.computeVertexNormals();
      if (!this.sharedMaterial) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((item) => item && imported.add(item));
      this.sharedMaterial.skinning = Boolean(child.isSkinnedMesh);
      this.sharedMaterial.morphTargets = Boolean(child.morphTargetInfluences);
      this.sharedMaterial.vertexColors = Boolean(child.geometry?.attributes?.color);
      child.material = this.sharedMaterial;
    });
    remove.forEach((child) => child.removeFromParent());
    imported.forEach((material) => material.dispose());
    if (this.config.normalizeModel !== false) {
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      model.position.sub(center);
      const reference = this.config.normalizeByLargestDimension
        ? Math.max(size.x, size.y, size.z)
        : size.y;
      this.normalizationGroup.scale.setScalar((this.config.targetSize ?? 4.2) / Math.max(reference, 0.001));
    }
    this.normalizationGroup.add(model);
  }

  hierarchyName(object, root) {
    const names = [];
    for (let current = object; current && current !== root; current = current.parent) {
      if (current.name) names.push(current.name);
    }
    return names.join("/");
  }

  bindEvents() {
    window.addEventListener("resize", this.boundResize, { passive: true });
    window.addEventListener("scroll", this.boundScroll, { passive: true });
    document.addEventListener("visibilitychange", this.boundVisibility);
    this.reduceMotion.addEventListener("change", this.boundMotion);
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.visible ? this.requestRender() : this.stopLoop();
    }, { threshold: 0 });
    this.observer.observe(this.config.visibilityTarget
      ? document.querySelector(this.config.visibilityTarget) || this.canvas
      : this.canvas);
  }

  queueResize() {
    if (this.resizeFrame) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = 0;
      this.resize();
    });
  }

  resize() {
    if (!this.renderer) return;
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight, 1);
    const performance = this.config.performance || {};
    const pixelCap = width < (this.config.breakpoints?.mobile ?? 768)
      ? performance.mobileMaxPixelRatio ?? 1
      : performance.maxPixelRatio ?? 1.5;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelCap));
    this.renderer.setSize(width, height, false);
    this.applyResponsiveLighting(width);
    this.collectSections();
    this.updateTargets(true);
    this.requestRender();
  }

  applyResponsiveLighting(width) {
    const mobile = this.config.breakpoints?.mobile ?? 768;
    const desktop = this.config.breakpoints?.desktop ?? 1025;
    const multiplier = width < mobile ? 0.78 : width < desktop ? 0.9 : 1;
    const light = this.config.lighting || {};
    this.keyLight.intensity = (light.keyIntensity ?? 3) * multiplier;
    this.rimLight.intensity = (light.rimIntensity ?? 2.2) * multiplier;
    this.fillLight.intensity = (light.fillIntensity ?? 0.4) * multiplier;
    this.pointLight.intensity = (light.pointIntensity ?? 1) * multiplier;
    if (this.sharedMaterial) this.sharedMaterial.envMapIntensity = (this.config.material?.envMapIntensity ?? 1.25) * (width < mobile ? 0.68 : multiplier);
  }

  collectSections() {
    this.sections = (this.config.sections || []).map(([name, selector]) => {
      const section = document.querySelector(selector)?.closest("section");
      if (!section) return null;
      const rect = section.getBoundingClientRect();
      return { name, center: window.scrollY + rect.top + rect.height * 0.5 };
    }).filter(Boolean);
  }

  getBlend() {
    const sections = this.sections;
    const fallback = sections[0]?.name || Object.keys(this.config.views)[0];
    if (!sections.length || this.reducedMotionEnabled()) return { from: fallback, to: fallback, amount: 0 };
    const center = window.scrollY + window.innerHeight * 0.5;
    if (center <= sections[0].center) return { from: sections[0].name, to: sections[0].name, amount: 0 };
    const last = sections.at(-1);
    if (center >= last.center) return { from: last.name, to: last.name, amount: 0 };
    for (let index = 0; index < sections.length - 1; index += 1) {
      const from = sections[index];
      const to = sections[index + 1];
      if (center < from.center || center > to.center) continue;
      const progress = (center - from.center) / Math.max(to.center - from.center, 1);
      return { from: from.name, to: to.name, amount: THREE.MathUtils.smoothstep(progress, 0, 1) };
    }
    return { from: fallback, to: fallback, amount: 0 };
  }

  responsiveView(view) {
    const width = window.innerWidth;
    const breakpoints = this.config.breakpoints || { mobile: 768, desktop: 1025 };
    if (width < breakpoints.mobile) return this.adjustMobile(view);
    if (width < breakpoints.desktop) return this.adjustTablet(view);
    return view;
  }

  adjustMobile(view) {
    const r = this.config.responsive.mobile;
    return {
      position: [r.positionXBase + (view.position[0] - r.positionXOrigin) * r.positionXFactor, (this.config.mobilePositionYBase ?? -0.3) + view.position[1] * r.positionYFactor, view.position[2] * r.positionXFactor],
      rotation: view.rotation.map((value) => value * r.rotationFactor),
      scale: clamp(view.scale * r.scaleFactor, r.scaleMin, r.scaleMax),
      cameraPosition: [0, view.cameraPosition[1] * r.cameraYFactor, clamp(lerp(7.2, view.cameraPosition[2], r.cameraZFactor), 6.8, 7.5)],
      cameraTarget: r.target,
    };
  }

  adjustTablet(view) {
    const r = this.config.responsive.tablet;
    return {
      position: [r.positionXBase + (view.position[0] - r.positionXOrigin) * r.positionXFactor, r.positionYBase + view.position[1] * r.positionYFactor, view.position[2] * r.positionYFactor],
      rotation: view.rotation.map((value) => value * r.rotationFactor),
      scale: clamp(view.scale * r.scaleFactor, r.scaleMin, r.scaleMax),
      cameraPosition: [view.cameraPosition[0], view.cameraPosition[1] * r.cameraYFactor, lerp(7.2, view.cameraPosition[2], r.cameraZFactor)],
      cameraTarget: [r.targetXBase + (view.cameraTarget[0] - r.targetXOrigin) * r.targetXFactor, view.cameraTarget[1] * r.targetYFactor, view.cameraTarget[2]],
    };
  }

  updateTargets(immediate = false) {
    const blend = this.getBlend();
    const from = this.responsiveView(this.config.views[blend.from]);
    const to = this.responsiveView(this.config.views[blend.to]);
    const mix = (a, b) => a.map((value, index) => lerp(value, b[index], blend.amount));
    this.target = {
      position: new THREE.Vector3(...mix(from.position, to.position)),
      rotation: new THREE.Vector3(...mix(from.rotation, to.rotation)),
      scale: clamp(lerp(from.scale, to.scale, blend.amount), 0.75, 1.65),
      cameraPosition: new THREE.Vector3(...mix(from.cameraPosition, to.cameraPosition)),
      cameraTarget: new THREE.Vector3(...mix(from.cameraTarget, to.cameraTarget)),
    };
    this.target.cameraPosition.z = clamp(this.target.cameraPosition.z, 5.5, 8);
    if (!this.current || immediate) this.current = {
      position: this.target.position.clone(), rotation: this.target.rotation.clone(), scale: this.target.scale,
      cameraPosition: this.target.cameraPosition.clone(), cameraTarget: this.target.cameraTarget.clone(),
    };
  }

  handleScroll() {
    this.lastScrollTime = performance.now();
    this.updateTargets();
    this.requestRender();
  }

  handleVisibility() {
    this.tabVisible = !document.hidden;
    this.tabVisible ? this.requestRender() : this.stopLoop();
  }

  handleMotionPreference() {
    this.updateTargets(true);
    this.requestRender();
  }

  reducedMotionEnabled() {
    return Boolean(this.config.performance?.disableOnReducedMotion && this.reduceMotion.matches);
  }

  shouldAnimateContinuously() {
    return this.visible && this.tabVisible && !this.reducedMotionEnabled() && this.config.animation?.enabled !== false;
  }

  requestRender() {
    if (this.destroyed || !this.renderer || !this.visible || !this.tabVisible || this.frame) return;
    if (!this.clock.running) this.clock.start();
    this.frame = requestAnimationFrame((time) => this.animate(time));
  }

  animate() {
    this.frame = 0;
    const elapsed = this.clock.getElapsedTime();
    if (this.modelLoaded && this.current && this.target) {
      this.current.position.lerp(this.target.position, 0.06);
      this.current.rotation.lerp(this.target.rotation, 0.06);
      this.current.scale += (this.target.scale - this.current.scale) * 0.06;
      this.current.cameraPosition.lerp(this.target.cameraPosition, 0.05);
      this.current.cameraTarget.lerp(this.target.cameraTarget, 0.05);
      const animation = this.config.animation || {};
      const idle = this.shouldAnimateContinuously() && window.innerWidth >= (this.config.breakpoints?.mobile ?? 768) && performance.now() - this.lastScrollTime > 180;
      this.layoutGroup.position.copy(this.current.position);
      this.layoutGroup.position.y += idle ? Math.sin(elapsed * (animation.floatSpeed ?? 0.35)) * (animation.floatAmplitude ?? 0.018) : 0;
      this.layoutGroup.scale.setScalar(this.current.scale);
      this.rotationGroup.rotation.set(this.current.rotation.x, this.current.rotation.y + (idle ? Math.sin(elapsed * (animation.rotationSpeed ?? 0.22)) * (animation.rotationAmplitude ?? 0.008) : 0), this.current.rotation.z);
      this.camera.position.copy(this.current.cameraPosition);
      this.camera.lookAt(this.current.cameraTarget);
      if (this.sharedMaterial) {
        const opacity = window.innerWidth < 768 ? 0.48 : window.innerWidth <= 1024 ? 0.62 : this.targetOpacity;
        this.currentOpacity = this.reducedMotionEnabled()
          ? opacity
          : this.currentOpacity + (opacity - this.currentOpacity) * 0.05;
        this.sharedMaterial.opacity = this.currentOpacity;
      }
    }
    this.renderer.render(this.scene, this.camera);
    if (this.shouldAnimateContinuously() || this.needsInterpolation()) this.requestRender();
  }

  needsInterpolation() {
    if (!this.current || !this.target) return false;
    return this.current.position.distanceToSquared(this.target.position) > 0.00001 ||
      this.current.rotation.distanceToSquared(this.target.rotation) > 0.00001 ||
      Math.abs(this.current.scale - this.target.scale) > 0.0001 ||
      this.current.cameraPosition.distanceToSquared(this.target.cameraPosition) > 0.00001;
  }

  stopLoop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.clock.stop();
  }

  setCanvasState(state) {
    this.canvas.classList.remove("anatomy-canvas--loading", "anatomy-canvas--ready", "anatomy-canvas--error");
    this.canvas.classList.add(`anatomy-canvas--${state}`);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopLoop();
    cancelAnimationFrame(this.resizeFrame);
    window.removeEventListener("resize", this.boundResize);
    window.removeEventListener("scroll", this.boundScroll);
    document.removeEventListener("visibilitychange", this.boundVisibility);
    this.reduceMotion.removeEventListener("change", this.boundMotion);
    this.observer?.disconnect();
    this.model?.traverse((child) => {
      child.geometry?.dispose?.();
      if (!this.sharedMaterial && child.isMesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material?.dispose?.());
      }
    });
    this.sharedMaterial?.dispose();
    this.dracoLoader?.dispose();
    this.scene.environment = null;
    this.environmentTexture?.dispose();
    this.environmentTarget?.dispose();
    this.renderer?.dispose();
  }
}
