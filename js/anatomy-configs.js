const sharedMaterial = {
  mode: "dark-glass",
  color: 0x151b22,
  roughness: 0.2,
  metalness: 0.72,
  clearcoat: 0.55,
  clearcoatRoughness: 0.18,
  transmission: 0,
  thickness: 0.7,
  envMapIntensity: 1.25,
  opacity: 0.72,
};

const sharedLighting = {
  exposure: 0.75,
  keyColor: 0xd9f7ff,
  keyIntensity: 3,
  rimColor: 0x55d8ee,
  rimIntensity: 2.2,
  fillSkyColor: 0xa9eaff,
  fillGroundColor: 0x050a10,
  fillIntensity: 0.4,
  pointColor: 0x4faec2,
  pointIntensity: 1,
};

const sharedAnimation = {
  enabled: true,
  rotationAmplitude: 0.008,
  rotationSpeed: 0.22,
  floatAmplitude: 0.018,
  floatSpeed: 0.35,
};

const sharedPerformance = {
  pauseWhenHidden: true,
  maxPixelRatio: 1.5,
  mobileMaxPixelRatio: 1,
  disableOnReducedMotion: true,
};

const spineViews = {
  overview: [[1.9,-0.15,0],[0.02,-0.5,0.01],1,[0,0,7.2],[0.8,0,0]],
  symptoms: [[1.55,0.1,0.15],[0,-4.25,-0.01],2.08,[0,0.15,6.5],[0.9,0.15,0]],
  cervical: [[1.45,-1.15,0.3],[0.03,-3.1,0],3.55,[0,0.7,5.8],[0.8,1.3,0]],
  thoracic: [[1.45,-0.25,0.2],[0,0.15,0.01],2.35,[0,0.15,6.1],[0.8,0.2,0]],
  lumbar: [[1.45,1.05,0.25],[-0.01,0.35,0],1,[0,-0.55,5.8],[0.8,-1,0]],
  assessment: [[4.75,0.25,0],[0.02,0.55,-0.01],0.68,[6,0,6.8],[0.9,-0.1,0]],
  recovery: [[2,-0.2,-0.1],[0.02,0.75,0],0.05,[0,0,7.5],[0.9,0,0]],
};

const kneeViews = {
  overview: [[1.9,-0.35,0],[0.03,-0.42,0.02],1,[0,0,7.2],[0.85,-0.15,0]],
  symptoms: [[1.75,-0.15,0.1],[0.02,-0.28,0.01],1.05,[0,0.1,7],[0.85,0,0]],
  safety: [[1.8,-0.45,0.1],[-0.02,-0.12,0],0.94,[0,0,7.3],[0.85,-0.15,0]],
  assessment: [[1.7,-0.1,0],[0.02,0.05,-0.01],1.02,[0,0.05,7.1],[0.82,0,0]],
  process: [[1.85,-0.25,0.1],[0,0.22,0.01],0.98,[0,0,7.25],[0.85,-0.1,0]],
  progression: [[1.7,-0.1,0],[0.02,0.38,0],1.04,[0,0,7.05],[0.82,0,0]],
  final: [[1.9,-0.4,0],[0,0.5,0],0.9,[0,0,7.4],[0.85,-0.15,0]],
};

const shoulderViews = {
  overview: [[1.9,-0.3,0],[0.04,-0.38,0.03],1,[0,0,7.2],[0.85,-0.1,0]],
  symptoms: [[1.75,-0.1,0.1],[0.03,-0.22,0.02],1.04,[0,0.1,7.05],[0.84,0,0]],
  safety: [[1.85,-0.4,0.1],[-0.01,-0.08,0.01],0.94,[0,0,7.3],[0.86,-0.15,0]],
  assessment: [[1.7,-0.05,0],[0.03,0.08,-0.01],1.02,[0,0.05,7.1],[0.82,0,0]],
  process: [[1.85,-0.2,0.1],[0.01,0.24,0.01],0.98,[0,0,7.25],[0.85,-0.08,0]],
  progression: [[1.7,-0.05,0],[0.03,0.4,0],1.04,[0,0,7.05],[0.82,0,0]],
  sport: [[1.82,-0.22,0.05],[0.01,0.52,0.02],1,[0,0,7.15],[0.85,-0.08,0]],
  final: [[1.92,-0.38,0],[0.01,0.62,0],0.9,[0,0,7.4],[0.86,-0.15,0]],
};

const neckViews = {
  overview: [[1.9,-0.3,0],[0.03,-0.4,0.02],1,[0,0,7.2],[0.86,-0.1,0]],
  symptoms: [[1.75,-0.1,0.1],[0.02,-0.24,0.01],1.04,[0,0.1,7.05],[0.84,0,0]],
  safety: [[1.85,-0.4,0.1],[-0.01,-0.1,0],0.94,[0,0,7.3],[0.86,-0.15,0]],
  assessment: [[1.7,-0.05,0],[0.02,0.06,-0.01],1.02,[0,0.05,7.1],[0.82,0,0]],
  process: [[1.85,-0.2,0.1],[0,0.22,0.01],0.98,[0,0,7.25],[0.85,-0.08,0]],
  progression: [[1.7,-0.05,0],[0.02,0.38,0],1.04,[0,0,7.05],[0.82,0,0]],
  daily: [[1.82,-0.2,0.05],[0,0.48,0.01],1,[0,0,7.15],[0.85,-0.08,0]],
  sport: [[1.75,-0.12,0],[0.02,0.58,0],1.02,[0,0,7.1],[0.83,-0.03,0]],
  final: [[1.92,-0.38,0],[0,0.68,0],0.9,[0,0,7.4],[0.86,-0.15,0]],
};

const hipViews = {
  overview: [[1.9,-0.35,0],[0.03,-0.42,0.02],1,[0,0,7.2],[0.86,-0.15,0]],
  symptoms: [[1.75,-0.15,0.1],[0.02,-0.27,0.01],1.04,[0,0.1,7.05],[0.84,0,0]],
  safety: [[1.85,-0.45,0.1],[-0.01,-0.12,0],0.94,[0,0,7.3],[0.86,-0.18,0]],
  assessment: [[1.7,-0.1,0],[0.02,0.04,-0.01],1.02,[0,0.05,7.1],[0.82,0,0]],
  process: [[1.85,-0.25,0.1],[0,0.2,0.01],0.98,[0,0,7.25],[0.85,-0.1,0]],
  progression: [[1.7,-0.1,0],[0.02,0.36,0],1.04,[0,0,7.05],[0.82,0,0]],
  sport: [[1.8,-0.2,0.05],[0.01,0.52,0.01],1,[0,0,7.15],[0.84,-0.08,0]],
  final: [[1.92,-0.42,0],[0,0.64,0],0.9,[0,0,7.4],[0.86,-0.18,0]],
};

function expandViews(views) {
  return Object.fromEntries(Object.entries(views).map(([name, values]) => [name, {
    position: values[0], rotation: values[1], scale: values[2],
    cameraPosition: values[3], cameraTarget: values[4],
  }]));
}

const shared = {
  normalizeModel: true,
  fov: 45,
  near: 0.1,
  far: 100,
  material: sharedMaterial,
  lighting: sharedLighting,
  animation: sharedAnimation,
  performance: sharedPerformance,
  breakpoints: { mobile: 768, desktop: 1025 },
  responsive: {
    tablet: { positionXBase: 1.35, positionXOrigin: 1.6, positionXFactor: 0.8, positionYBase: -0.1, positionYFactor: 0.75, scaleFactor: 0.85, scaleMin: 0.8, scaleMax: 1.4, rotationFactor: 0.8, cameraYFactor: 0.6, cameraZFactor: 0.65, targetXBase: 0.72, targetXOrigin: 0.8, targetXFactor: 0.6, targetYFactor: 0.6 },
    mobile: { positionXBase: 0.68, positionXOrigin: 1.6, positionXFactor: 0.4, positionYFactor: 0.5, scaleFactor: 0.72, scaleMin: 0.75, scaleMax: 1.05, rotationFactor: 0.4, cameraYFactor: 0.15, cameraZFactor: 0.22, target: [0.48,0,0] },
  },
};

export const spineConfig = {
  ...shared,
  modelUrl: new URL("../src/assets/models/the_human_spinal_column.glb", import.meta.url).href,
  modelName: "spine",
  targetSize: 4.2,
  views: expandViews(spineViews),
  sections: [["overview","#back-title"],["symptoms","#experiences-title"],["cervical","#safety-title"],["thoracic","#assessment-title"],["lumbar","#process-title"],["assessment","#progression-title"],["recovery","#final-title"]],
  removeMeshesMatching: /(text\d*|labels|marker|cylinder\d*)/i,
  mobilePositionYBase: -0.3,
};

export const kneeConfig = {
  ...shared,
  modelUrl: new URL("../src/assets/models/knee.glb", import.meta.url).href,
  modelName: "knee",
  targetSize: 4.4,
  views: expandViews(kneeViews),
  sections: [["overview","#knee-title"],["symptoms","#experiences-title"],["safety","#safety-title"],["assessment","#assessment-title"],["process","#process-title"],["progression","#progression-title"],["final","#final-title"]],
  mobilePositionYBase: -0.62,
};

export const shoulderConfig = {
  ...shared,
  modelUrl: new URL("../src/assets/models/shoulder.glb", import.meta.url).href,
  modelName: "shoulder",
  targetSize: 4.3,
  views: expandViews(shoulderViews),
  sections: [["overview","#shoulder-title"],["symptoms","#experiences-title"],["safety","#safety-title"],["assessment","#assessment-title"],["process","#process-title"],["progression","#progression-title"],["sport","#sport-title"],["final","#final-title"]],
  mobilePositionYBase: -0.58,
};

export const neckConfig = {
  ...shared,
  modelUrl: new URL("../src/assets/models/neck.glb", import.meta.url).href,
  modelName: "neck",
  targetSize: 4.3,
  views: expandViews(neckViews),
  sections: [["overview","#neck-title"],["symptoms","#experiences-title"],["safety","#safety-title"],["assessment","#assessment-title"],["process","#process-title"],["progression","#progression-title"],["daily","#daily-title"],["sport","#sport-title"],["final","#final-title"]],
  mobilePositionYBase: -0.6,
};

export const hipConfig = {
  ...shared,
  modelUrl: new URL("../src/assets/models/hip.glb", import.meta.url).href,
  modelName: "hip",
  targetSize: 4.3,
  views: expandViews(hipViews),
  sections: [["overview","#hip-title"],["symptoms","#experiences-title"],["safety","#safety-title"],["assessment","#assessment-title"],["process","#process-title"],["progression","#progression-title"],["sport","#sport-title"],["final","#final-title"]],
  mobilePositionYBase: -0.62,
};
