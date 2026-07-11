import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const hero = document.querySelector(".hero-section");
const canvas = document.querySelector("#hero-canvas");

if (hero && canvas) {
  const scene = new THREE.Scene();
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
  renderer.toneMappingExposure = 1.1;

  let model = null;
  const sphereRadius = 3.15;
  const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
  const sphereGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.12,
    transmission: 1,
    thickness: 0.15,
    ior: 1.12,
    roughness: 0.03,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const sphereGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const glassSphereGroup = new THREE.Group();
  const glassSphere = new THREE.Mesh(sphereGeometry, sphereGlassMaterial);
  const sphereGlow = new THREE.Mesh(sphereGeometry, sphereGlowMaterial);
  glassSphere.renderOrder = 1;
  sphereGlow.renderOrder = 2;
  sphereGlow.scale.setScalar(1.1);
  glassSphereGroup.add(glassSphere, sphereGlow);
  glassSphereGroup.visible = false;
  scene.add(glassSphereGroup);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdcecff,
    transparent: true,
    opacity: 0.72,
    transmission: 1,
    thickness: 0.35,
    ior: 1.45,
    roughness: 0.08,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  function loadModel() {
    const loader = new GLTFLoader();

    loader.load(
      "./src/assets/models/aim-human.glb",
      (gltf) => {
        model = gltf.scene;
        model.scale.setScalar(1);

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.y -= bounds.min.y;

        bounds.setFromObject(model);
        bounds.getCenter(glassSphereGroup.position);
        glassSphereGroup.visible = true;

        const exportedMaterials = new Set();
        model.traverse((child) => {
          if (child.isMesh) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((material) => exportedMaterials.add(material));
            child.material = glassMaterial;
          }
        });
        exportedMaterials.forEach((material) => material?.dispose());

        scene.add(model);
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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xe8f4ff, 3);
  directionalLight.position.set(4, 5, 6);
  scene.add(directionalLight);

  const bluePointLight = new THREE.PointLight(0x75c9ff, 8, 20);
  bluePointLight.position.set(-4, 2, -3);
  scene.add(bluePointLight);

  const whitePointLight = new THREE.PointLight(0xffffff, 5, 12);
  whitePointLight.position.set(0, -3, 2);
  scene.add(whitePointLight);

  const rimLight = new THREE.PointLight(0x8abfff, 8, 20);
  rimLight.position.set(-3, 3, -4);
  scene.add(rimLight);

  camera.position.set(-0.2, 0.35, 0.5);
  loadModel();

  function animate(time = 0) {
    requestAnimationFrame(animate);
    if (model) {
      model.rotation.y += 0.0005;
    }
    const breathingScale =
      1.006 + 0.006 * Math.sin(time * 0.001 - Math.PI / 2);
    glassSphereGroup.scale.setScalar(breathingScale);
    renderer.render(scene, camera);
  }

  function resize() {
    const width = hero.clientWidth;
    const height = hero.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
  }

  new ResizeObserver(resize).observe(hero);

  window.addEventListener("pagehide", () => {
    if (model) {
      model.traverse((child) => {
        if (!child.isMesh) return;

        child.geometry?.dispose();
      });
    }
    glassMaterial.dispose();
    sphereGeometry.dispose();
    sphereGlassMaterial.dispose();
    sphereGlowMaterial.dispose();
    renderer.dispose();
  });

  animate();
}
