import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

const DEVELOPMENT_LOGS =
  typeof location !== "undefined" &&
  (
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    new URLSearchParams(location.search).has("aimDebug")
  );
const debugLog = (...args) => {
  if (DEVELOPMENT_LOGS) console.info(...args);
};

const INSTANCE_COUNT = 4096;
const POSITION_TEXTURE_SIZE = 64;
const DEFAULT_SIMULATION = {
  noiseScale: 1.15,
  noiseStrength: 0.35,
  outwardStrength: 0.015,
  velocityDamping: 1.1,
  maxSpeed: 0.55,
  activationDuration: 4,
  simulationSubsteps: 1,
};
const DEFAULT_SDF = {
  enabled: true,
  surfaceOffset: 0.011,
  surfaceAttraction: 8,
  surfaceDamping: 5,
  gradientStep: 1,
  forceMax: 2,
  tangentialFlow: 0.75,
  influence: 1,
  influenceDamping: 3.5,
  volumeRecoveryStrength: 4,
  volumeRecoveryMax: 1.5,
};
const DEFAULT_ORIENTATION = {
  enabled: true,
  method: "vertex-tbn",
  blockLength: 0.032,
  blockHeight: 0.01,
  blockWidth: 0.01,
  velocityThreshold: 0.01,
  sdfGradientStep: 1,
  influence: 1,
  normalBlend: 1,
  lengthVariation: 0.12,
  speedStretch: 0.15,
  maximumStretch: 0.35,
  surfacePivot: "center",
};
const DEFAULT_COLLISION = {
  enabled: true,
  radius: 0.016,
  skin: 0.003,
  correctionStrength: 1,
  correctionMax: 0.08,
  restitution: 0,
  friction: 0.0,
  gradientStep: 1,
  velocityThreshold: 0.01,
  influence: 1,
  substeps: 1,
  midpointProbe: false,
};
const DEFAULT_POINTER = {
  enabled: true,
  radius: 0.16,
  force: 2.2,
  dragForce: 0.45,
  falloffInner: 0.25,
  velocitySmoothing: 18,
  maxVelocity: 2.5,
  maxAcceleration: 4,
  inactiveVelocityDecay: 14,
  raycastRecursive: true,
};
const DEFAULT_LOCALIZED_ACTIVITY = {
  enabled: true,
  radius: 0.2,
  innerRadius: 0.025,
  power: 1.2,
  activeCurlStrength: 1,
  activeDamping: 1,
  inactiveDamping: 8,
  inactiveTangentialDamping: 10,
  pointerVelocityDeadZone: 0.002,
  activityBrightness: 0.1,
  useActivityTexture: false,
  activityAttack: 18,
  activityRelease: 4.5,
};
const DEFAULT_INFINITY_FLOW = {
  enabled: true,
  radius: 0.01,
  strength: 1.3,
  radialStrength: 0.9,
  centerPull: 1.2,
  thickness: 0.025,
  verticalScale: 0.62,
  speed: 1,
  noiseStrength: 0.08,
  accelerationMax: 3,
  velocityMax: 1.5,
  pointerRepulsionMultiplier: 0.25,
  pointerDragMultiplier: 0.15,
  tangentVelocityThreshold: 0.002,
  orientationMode: "pointer-motion",
};
const DEFAULT_PARTICLE_SCALE_INTERACTION = {
  enabled: true,
  minScale: 0.002,
  maxScale: 0.6,
  attack: 5,
  release: 3.5,
  variationMin: 0.44,
  variationMax: 0.96,
  usePersistentScaleTexture: true,
};
const DEFAULT_INNER_CRYSTAL = {
  enabled: true,
  color: 0x404a55,
  roughness: 0.32,
  metalness: 0.88,
  clearcoat: 0.18,
  clearcoatRoughness: 0.28,
  envMapIntensity: 0.85,
  depthTest: true,
  depthWrite: true,
  side: "front",
};
const DEFAULT_PARTICLE_COLLISIONS = {
  enabled: false,
  quality: "desktop",
  desktopGridResolution: [64, 64, 64],
  mobileGridResolution: [32, 32, 32],
  radius: 0.007,
  skin: 0.0015,
  correctionStrength: 0.75,
  correctionMax: 0.02,
  correctionMode: "average",
  restitution: 0,
  friction: 0.08,
  maxNeighborsDesktop: 24,
  maxNeighborsMobile: 12,
  rebuildEveryNFramesDesktop: 1,
  rebuildEveryNFramesMobile: 2,
  correctionVelocityInfluence: 0.1,
  substepsDesktop: 2,
  substepsMobile: 1,
  gridPadding: 0.15,
};
const DEFAULT_VISUAL = {
  preset: "dark-crystal-metal",
  baseColor: 0x202a35,
  secondaryColor: 0x40566a,
  metalness: 0.56,
  roughness: 0.3,
  clearcoat: 0.22,
  clearcoatRoughness: 0.34,
  envMapIntensity: 0.92,
  brightnessVariation: 0.12,
  roughnessVariation: 0.08,
  hoverBrightness: 0.22,
  hoverRoughnessReduction: 0.05,
  hoverColor: 0x78a6c8,
  hoverEmissiveStrength: 0.04,
  hoverFadeSpeed: 12,
  fresnelColor: 0x7896ad,
  fresnelStrength: 0.08,
  fresnelPower: 3,
  speedBrightness: 0.04,
  speedHighlightMin: 0.08,
  speedHighlightMax: 0.45,
  transmission: 0,
  opacity: 1,
  depthWrite: true,
  transparent: false,
  bloomEnabled: false,
  bloomStrength: 0.15,
  bloomThreshold: 0.9,
  bloomRadius: 0.15,
  innerGlassVisible: true,
};
const VISUAL_PRESETS = {
  metal: {
    baseColor: 0x18212b,
    secondaryColor: 0x273543,
    metalness: 0.72,
    roughness: 0.34,
    clearcoat: 0.08,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.68,
  },
  crystal: {
    baseColor: 0x17212a,
    secondaryColor: 0x2b3c4a,
    metalness: 0.34,
    roughness: 0.22,
    clearcoat: 0.34,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.82,
  },
  "dark-crystal-metal": {
    baseColor: 0x202a35,
    secondaryColor: 0x40566a,
    metalness: 0.56,
    roughness: 0.3,
    clearcoat: 0.22,
    clearcoatRoughness: 0.34,
    envMapIntensity: 0.92,
  },
};

const FULLSCREEN_VERTEX_SHADER = `
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const COPY_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uSourceTexture;
in vec2 vUv;
out vec4 outColor;

void main() {
  outColor = texture(uSourceTexture, vUv);
}
`;

const POSITION_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform float uDeltaTime;
uniform float uActivation;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec4 positionSample = texture(uPositionTexture, vUv);
  vec3 velocity = texture(uVelocityTexture, vUv).xyz;
  vec3 position = positionSample.xyz +
    velocity * uDeltaTime * uActivation;
  outColor = vec4(position, positionSample.a);
}
`;

const PARTICLE_SCALE_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uPreviousScaleTexture;
uniform sampler2D uPositionTexture;
uniform vec3 uPointerPosition;
uniform float uPointerActive;
uniform float uPointerActivityInnerRadius;
uniform float uPointerActivityRadius;
uniform float uPointerActivityPower;
uniform float uScaleAttack;
uniform float uScaleRelease;
uniform float uDeltaTime;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec3 particlePosition = texture(uPositionTexture, vUv).xyz;
  float previousActivity =
    texture(uPreviousScaleTexture, vUv).r;
  float targetActivity =
    1.0 -
    smoothstep(
      min(uPointerActivityInnerRadius, uPointerActivityRadius),
      max(uPointerActivityRadius, 0.00001),
      distance(particlePosition, uPointerPosition)
    );
  targetActivity = pow(
    clamp(targetActivity, 0.0, 1.0),
    max(uPointerActivityPower, 0.00001)
  );
  targetActivity *= uPointerActive;
  float responseSpeed = targetActivity > previousActivity
    ? uScaleAttack
    : uScaleRelease;
  float blendFactor =
    1.0 - exp(-max(responseSpeed, 0.0) * uDeltaTime);
  float nextActivity = clamp(
    mix(previousActivity, targetActivity, blendFactor),
    0.0,
    1.0
  );
  outColor = vec4(nextActivity, 0.0, 0.0, 1.0);
}
`;

const PARTICLE_VOXEL_KEY_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uPositionTexture;
uniform vec3 uGridBoundsMin;
uniform vec3 uGridBoundsMax;
uniform ivec3 uGridResolution;
in vec2 vUv;
out vec4 outColor;

void main() {
  ivec2 particleCoord = ivec2(gl_FragCoord.xy);
  int particleIndex =
    particleCoord.x + particleCoord.y * ${POSITION_TEXTURE_SIZE};
  vec3 position =
    texelFetch(uPositionTexture, particleCoord, 0).xyz;
  vec3 gridUv =
    (position - uGridBoundsMin) /
    (uGridBoundsMax - uGridBoundsMin);
  bool insideGrid =
    all(greaterThanEqual(gridUv, vec3(0.0))) &&
    all(lessThan(gridUv, vec3(1.0)));
  int invalidKey =
    uGridResolution.x *
    uGridResolution.y *
    uGridResolution.z;
  int voxelKey = invalidKey;
  if (insideGrid) {
    ivec3 voxelCoord = clamp(
      ivec3(floor(gridUv * vec3(uGridResolution))),
      ivec3(0),
      uGridResolution - ivec3(1)
    );
    voxelKey =
      voxelCoord.x +
      voxelCoord.y * uGridResolution.x +
      voxelCoord.z *
        uGridResolution.x *
        uGridResolution.y;
  }
  outColor = vec4(
    float(voxelKey),
    float(particleIndex),
    0.0,
    insideGrid ? 1.0 : 0.0
  );
}
`;

const PARTICLE_VOXEL_SORT_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uSortTexture;
uniform int uSortStage;
uniform int uSortPass;
in vec2 vUv;
out vec4 outColor;

bool recordLess(vec4 leftRecord, vec4 rightRecord) {
  return leftRecord.r < rightRecord.r ||
    (
      leftRecord.r == rightRecord.r &&
      leftRecord.g < rightRecord.g
    );
}

void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  int index = coord.x + coord.y * ${POSITION_TEXTURE_SIZE};
  int partnerIndex = index ^ uSortPass;
  ivec2 partnerCoord = ivec2(
    partnerIndex % ${POSITION_TEXTURE_SIZE},
    partnerIndex / ${POSITION_TEXTURE_SIZE}
  );
  vec4 currentRecord = texelFetch(uSortTexture, coord, 0);
  vec4 partnerRecord =
    texelFetch(uSortTexture, partnerCoord, 0);
  bool ascending = (index & uSortStage) == 0;
  bool lowerIndex = index < partnerIndex;
  vec4 minimumRecord = recordLess(
    currentRecord,
    partnerRecord
  ) ? currentRecord : partnerRecord;
  vec4 maximumRecord = recordLess(
    currentRecord,
    partnerRecord
  ) ? partnerRecord : currentRecord;
  bool selectMinimum =
    (ascending && lowerIndex) ||
    (!ascending && !lowerIndex);
  outColor = selectMinimum
    ? minimumRecord
    : maximumRecord;
}
`;

const PARTICLE_VOXEL_RANGE_VERTEX_SHADER = `
precision highp float;
uniform sampler2D uSortedParticleTexture;
uniform int uInvalidVoxelKey;
uniform int uVoxelTextureWidth;
uniform int uVoxelTextureHeight;
uniform int uBuildStart;
out float vRangeIndex;

vec4 getRecord(int index) {
  return texelFetch(
    uSortedParticleTexture,
    ivec2(
      index % ${POSITION_TEXTURE_SIZE},
      index / ${POSITION_TEXTURE_SIZE}
    ),
    0
  );
}

void main() {
  int sortedIndex = gl_VertexID;
  int voxelKey = int(getRecord(sortedIndex).r + 0.5);
  int adjacentKey = uBuildStart == 1
    ? (
        sortedIndex > 0
          ? int(getRecord(sortedIndex - 1).r + 0.5)
          : -1
      )
    : (
        sortedIndex < ${INSTANCE_COUNT - 1}
          ? int(getRecord(sortedIndex + 1).r + 0.5)
          : uInvalidVoxelKey
      );
  bool boundary =
    voxelKey < uInvalidVoxelKey &&
    voxelKey != adjacentKey;
  if (boundary) {
    int packedX = voxelKey % uVoxelTextureWidth;
    int packedY = voxelKey / uVoxelTextureWidth;
    vec2 packedUv =
      (vec2(packedX, packedY) + 0.5) /
      vec2(uVoxelTextureWidth, uVoxelTextureHeight);
    gl_Position = vec4(packedUv * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = 1.0;
    vRangeIndex = float(
      uBuildStart == 1 ? sortedIndex : sortedIndex + 1
    );
  } else {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = 1.0;
    vRangeIndex = 0.0;
  }
}
`;

const PARTICLE_VOXEL_RANGE_FRAGMENT_SHADER = `
precision highp float;
in float vRangeIndex;
out vec4 outColor;

void main() {
  outColor = vec4(vRangeIndex, 0.0, 0.0, 1.0);
}
`;

const PARTICLE_COLLISION_COMMON = `
uniform sampler2D uSortedParticleTexture;
uniform sampler2D uVoxelStartTexture;
uniform sampler2D uVoxelEndTexture;
uniform vec3 uGridBoundsMin;
uniform vec3 uGridBoundsMax;
uniform ivec3 uGridResolution;
uniform int uVoxelTextureWidth;
uniform int uMaxNeighbors;
uniform float uParticleCollisionRadius;
uniform float uParticleCollisionSkin;
uniform float uParticleCollisionEnabled;

ivec2 particleTexel(int particleIndex) {
  return ivec2(
    particleIndex % ${POSITION_TEXTURE_SIZE},
    particleIndex / ${POSITION_TEXTURE_SIZE}
  );
}

ivec2 voxelRangeTexel(int voxelKey) {
  return ivec2(
    voxelKey % uVoxelTextureWidth,
    voxelKey / uVoxelTextureWidth
  );
}

bool getVoxelCoord(vec3 position, out ivec3 voxelCoord) {
  vec3 gridUv =
    (position - uGridBoundsMin) /
    (uGridBoundsMax - uGridBoundsMin);
  bool valid =
    all(greaterThanEqual(gridUv, vec3(0.0))) &&
    all(lessThan(gridUv, vec3(1.0)));
  voxelCoord = clamp(
    ivec3(floor(gridUv * vec3(uGridResolution))),
    ivec3(0),
    uGridResolution - ivec3(1)
  );
  return valid;
}

int flattenVoxel(ivec3 voxelCoord) {
  return
    voxelCoord.x +
    voxelCoord.y * uGridResolution.x +
    voxelCoord.z *
      uGridResolution.x *
      uGridResolution.y;
}

vec3 deterministicPairDirection(
  int particleIndex,
  int neighborIndex
) {
  int lowIndex = min(particleIndex, neighborIndex);
  int highIndex = max(particleIndex, neighborIndex);
  float seed =
    float(lowIndex) * 12.9898 +
    float(highIndex) * 78.233;
  vec3 direction = vec3(
    sin(seed),
    cos(seed * 1.37),
    sin(seed * 2.11 + 0.7)
  );
  float directionLength = length(direction);
  direction = directionLength > 0.00001
    ? direction / directionLength
    : vec3(1.0, 0.0, 0.0);
  return particleIndex == lowIndex ? direction : -direction;
}

const ivec3 PARTICLE_NEIGHBOR_OFFSETS[27] = ivec3[27](
  ivec3(0, 0, 0),
  ivec3(1, 0, 0), ivec3(-1, 0, 0),
  ivec3(0, 1, 0), ivec3(0, -1, 0),
  ivec3(0, 0, 1), ivec3(0, 0, -1),
  ivec3(1, 1, 0), ivec3(1, -1, 0),
  ivec3(-1, 1, 0), ivec3(-1, -1, 0),
  ivec3(1, 0, 1), ivec3(1, 0, -1),
  ivec3(-1, 0, 1), ivec3(-1, 0, -1),
  ivec3(0, 1, 1), ivec3(0, 1, -1),
  ivec3(0, -1, 1), ivec3(0, -1, -1),
  ivec3(1, 1, 1), ivec3(1, 1, -1),
  ivec3(1, -1, 1), ivec3(1, -1, -1),
  ivec3(-1, 1, 1), ivec3(-1, 1, -1),
  ivec3(-1, -1, 1), ivec3(-1, -1, -1)
);
`;

const PARTICLE_COLLISION_POSITION_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uExternalCorrectedPositionTexture;
uniform float uParticleCollisionCorrectionStrength;
uniform float uParticleCollisionCorrectionMax;
uniform float uParticleCollisionAverage;
uniform int uParticleCollisionDebugMode;
uniform int uVoxelCount;
${PARTICLE_COLLISION_COMMON}
in vec2 vUv;
out vec4 outColor;

void main() {
  ivec2 currentTexel = ivec2(gl_FragCoord.xy);
  int particleIndex =
    currentTexel.x + currentTexel.y * ${POSITION_TEXTURE_SIZE};
  vec4 positionSample = texelFetch(
    uExternalCorrectedPositionTexture,
    currentTexel,
    0
  );
  vec3 position = positionSample.xyz;
  ivec3 currentVoxel;
  vec3 correction = vec3(0.0);
  float collisionCount = 0.0;
  float maximumPenetration = 0.0;
  float currentVoxelOccupancy = 0.0;
  float debugVoxelKey = 0.0;
  int checkedNeighbors = 0;
  float minimumDistance =
    2.0 * uParticleCollisionRadius +
    uParticleCollisionSkin;
  float minimumDistanceSquared =
    minimumDistance * minimumDistance;

  if (
    uParticleCollisionEnabled > 0.0 &&
    getVoxelCoord(position, currentVoxel)
  ) {
    int currentVoxelKey = flattenVoxel(currentVoxel);
    debugVoxelKey = float(currentVoxelKey);
    ivec2 currentRangeTexel =
      voxelRangeTexel(currentVoxelKey);
    vec4 currentStart = texelFetch(
      uVoxelStartTexture,
      currentRangeTexel,
      0
    );
    vec4 currentEnd = texelFetch(
      uVoxelEndTexture,
      currentRangeTexel,
      0
    );
    if (currentStart.a > 0.5 && currentEnd.a > 0.5) {
      currentVoxelOccupancy =
        max(currentEnd.r - currentStart.r, 0.0);
    }
    for (int voxelOffsetIndex = 0; voxelOffsetIndex < 27; voxelOffsetIndex++) {
          ivec3 neighborVoxel =
            currentVoxel +
            PARTICLE_NEIGHBOR_OFFSETS[voxelOffsetIndex];
          bool voxelValid =
            all(greaterThanEqual(neighborVoxel, ivec3(0))) &&
            all(lessThan(neighborVoxel, uGridResolution));
          if (voxelValid && checkedNeighbors < uMaxNeighbors) {
            int voxelKey = flattenVoxel(neighborVoxel);
            ivec2 rangeTexel = voxelRangeTexel(voxelKey);
            vec4 startRecord =
              texelFetch(uVoxelStartTexture, rangeTexel, 0);
            vec4 endRecord =
              texelFetch(uVoxelEndTexture, rangeTexel, 0);
            int rangeStart = int(startRecord.r + 0.5);
            int rangeEnd = int(endRecord.r + 0.5);
            bool rangeActive =
              startRecord.a > 0.5 && endRecord.a > 0.5;
            for (
              int rangeOffset = 0;
              rangeOffset < 24;
              rangeOffset++
            ) {
              int sortedIndex = rangeStart + rangeOffset;
              if (
                rangeActive &&
                sortedIndex < rangeEnd &&
                checkedNeighbors < uMaxNeighbors
              ) {
                vec4 sortedRecord = texelFetch(
                  uSortedParticleTexture,
                  particleTexel(sortedIndex),
                  0
                );
                int neighborIndex =
                  int(sortedRecord.g + 0.5);
                if (
                  neighborIndex >= 0 &&
                  neighborIndex < ${INSTANCE_COUNT} &&
                  neighborIndex != particleIndex
                ) {
                  checkedNeighbors++;
                  vec3 neighborPosition = texelFetch(
                    uExternalCorrectedPositionTexture,
                    particleTexel(neighborIndex),
                    0
                  ).xyz;
                  vec3 pairDelta = position - neighborPosition;
                  float distanceSquared =
                    dot(pairDelta, pairDelta);
                  if (distanceSquared < minimumDistanceSquared) {
                    float pairDistance = sqrt(
                      max(distanceSquared, 0.0000001)
                    );
                    vec3 pairNormal =
                      distanceSquared > 0.0000001
                        ? pairDelta / pairDistance
                        : deterministicPairDirection(
                            particleIndex,
                            neighborIndex
                          );
                    float penetration =
                      minimumDistance - pairDistance;
                    maximumPenetration =
                      max(maximumPenetration, penetration);
                    correction +=
                      pairNormal * penetration * 0.5;
                    collisionCount += 1.0;
                  }
                }
              }
            }
          }
    }
  }
  if (uParticleCollisionAverage > 0.5 && collisionCount > 0.0) {
    correction /= collisionCount;
  }
  correction *= uParticleCollisionCorrectionStrength;
  float correctionLength = length(correction);
  if (correctionLength > uParticleCollisionCorrectionMax) {
    correction *=
      uParticleCollisionCorrectionMax / correctionLength;
  }
  position += correction * uParticleCollisionEnabled;
  float debugValue = positionSample.a;
  if (uParticleCollisionDebugMode == 1) {
    debugValue = debugVoxelKey / max(float(uVoxelCount - 1), 1.0);
  } else if (uParticleCollisionDebugMode == 2) {
    debugValue = clamp(
      currentVoxelOccupancy / float(uMaxNeighbors),
      0.0,
      1.0
    );
  } else if (uParticleCollisionDebugMode == 3) {
    debugValue = clamp(
      collisionCount / float(uMaxNeighbors),
      0.0,
      1.0
    );
  } else if (uParticleCollisionDebugMode == 4) {
    debugValue = clamp(
      maximumPenetration / max(minimumDistance, 0.00001),
      0.0,
      1.0
    );
  } else if (uParticleCollisionDebugMode == 5) {
    debugValue = clamp(
      length(correction) /
        max(uParticleCollisionCorrectionMax, 0.00001),
      0.0,
      1.0
    );
  } else if (uParticleCollisionDebugMode == 6) {
    debugValue =
      currentVoxelOccupancy > float(uMaxNeighbors)
        ? 1.0
        : 0.0;
  }
  outColor = vec4(position, debugValue);
}
`;

const PARTICLE_COLLISION_VELOCITY_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uExternalCorrectedVelocityTexture;
uniform sampler2D uExternalCorrectedPositionTexture;
uniform sampler2D uParticleCorrectedPositionTexture;
uniform float uParticleRestitution;
uniform float uParticleFriction;
uniform float uParticleCorrectionVelocityInfluence;
uniform float uParticleMaxSpeed;
uniform float uDeltaTime;
${PARTICLE_COLLISION_COMMON}
in vec2 vUv;
out vec4 outColor;

void main() {
  ivec2 currentTexel = ivec2(gl_FragCoord.xy);
  int particleIndex =
    currentTexel.x + currentTexel.y * ${POSITION_TEXTURE_SIZE};
  vec4 velocitySample = texelFetch(
    uExternalCorrectedVelocityTexture,
    currentTexel,
    0
  );
  vec3 velocity = velocitySample.xyz;
  vec3 externalPosition = texelFetch(
    uExternalCorrectedPositionTexture,
    currentTexel,
    0
  ).xyz;
  vec3 position = texelFetch(
    uParticleCorrectedPositionTexture,
    currentTexel,
    0
  ).xyz;
  ivec3 currentVoxel;
  vec3 velocityCorrection = vec3(0.0);
  int checkedNeighbors = 0;
  float minimumDistance =
    2.0 * uParticleCollisionRadius +
    uParticleCollisionSkin;
  float contactDistance =
    minimumDistance + uParticleCollisionSkin;

  if (
    uParticleCollisionEnabled > 0.0 &&
    getVoxelCoord(position, currentVoxel)
  ) {
    for (int voxelOffsetIndex = 0; voxelOffsetIndex < 27; voxelOffsetIndex++) {
          ivec3 neighborVoxel =
            currentVoxel +
            PARTICLE_NEIGHBOR_OFFSETS[voxelOffsetIndex];
          bool voxelValid =
            all(greaterThanEqual(neighborVoxel, ivec3(0))) &&
            all(lessThan(neighborVoxel, uGridResolution));
          if (voxelValid && checkedNeighbors < uMaxNeighbors) {
            int voxelKey = flattenVoxel(neighborVoxel);
            ivec2 rangeTexel = voxelRangeTexel(voxelKey);
            vec4 startRecord =
              texelFetch(uVoxelStartTexture, rangeTexel, 0);
            vec4 endRecord =
              texelFetch(uVoxelEndTexture, rangeTexel, 0);
            int rangeStart = int(startRecord.r + 0.5);
            int rangeEnd = int(endRecord.r + 0.5);
            bool rangeActive =
              startRecord.a > 0.5 && endRecord.a > 0.5;
            for (
              int rangeOffset = 0;
              rangeOffset < 24;
              rangeOffset++
            ) {
              int sortedIndex = rangeStart + rangeOffset;
              if (
                rangeActive &&
                sortedIndex < rangeEnd &&
                checkedNeighbors < uMaxNeighbors
              ) {
                int neighborIndex = int(
                  texelFetch(
                    uSortedParticleTexture,
                    particleTexel(sortedIndex),
                    0
                  ).g + 0.5
                );
                if (
                  neighborIndex >= 0 &&
                  neighborIndex < ${INSTANCE_COUNT} &&
                  neighborIndex != particleIndex
                ) {
                  checkedNeighbors++;
                  vec3 neighborPosition = texelFetch(
                    uParticleCorrectedPositionTexture,
                    particleTexel(neighborIndex),
                    0
                  ).xyz;
                  vec3 pairDelta = position - neighborPosition;
                  float pairDistanceSquared =
                    dot(pairDelta, pairDelta);
                  if (
                    pairDistanceSquared <
                    contactDistance * contactDistance
                  ) {
                    float pairDistance = sqrt(
                      max(pairDistanceSquared, 0.0000001)
                    );
                    vec3 pairNormal =
                      pairDistanceSquared > 0.0000001
                        ? pairDelta / pairDistance
                        : deterministicPairDirection(
                            particleIndex,
                            neighborIndex
                          );
                    vec3 neighborVelocity = texelFetch(
                      uExternalCorrectedVelocityTexture,
                      particleTexel(neighborIndex),
                      0
                    ).xyz;
                    vec3 relativeVelocity =
                      velocitySample.xyz - neighborVelocity;
                    float relativeNormalSpeed =
                      dot(relativeVelocity, pairNormal);
                    if (relativeNormalSpeed < 0.0) {
                      float impulseMagnitude =
                        -(1.0 + uParticleRestitution) *
                        relativeNormalSpeed * 0.5;
                      velocityCorrection +=
                        pairNormal * impulseMagnitude;
                      vec3 relativeTangentVelocity =
                        relativeVelocity -
                        pairNormal * relativeNormalSpeed;
                      vec3 frictionImpulse =
                        -relativeTangentVelocity *
                        uParticleFriction * 0.5;
                      float frictionLength =
                        length(frictionImpulse);
                      if (
                        frictionLength > impulseMagnitude &&
                        frictionLength > 0.00001
                      ) {
                        frictionImpulse *=
                          impulseMagnitude / frictionLength;
                      }
                      velocityCorrection += frictionImpulse;
                    }
                  }
                }
              }
            }
          }
    }
  }
  velocity += velocityCorrection * uParticleCollisionEnabled;
  vec3 correctionVelocity =
    (position - externalPosition) / max(uDeltaTime, 0.0001);
  velocity +=
    correctionVelocity *
    uParticleCorrectionVelocityInfluence *
    uParticleCollisionEnabled;
  float finalSpeed = length(velocity);
  if (finalSpeed > uParticleMaxSpeed) {
    velocity *= uParticleMaxSpeed / finalSpeed;
  }
  outColor = vec4(velocity, velocitySample.a);
}
`;

const COLLISION_SDF_HELPERS = `
uniform sampler3D uCollisionTexture;
uniform vec3 uCollisionBoundsMin;
uniform vec3 uCollisionBoundsMax;
uniform vec3 uCollisionVoxelSize;
uniform float uCollisionGradientStep;

bool insideCollisionVolume(vec3 worldPosition) {
  vec3 collisionUv =
    (worldPosition - uCollisionBoundsMin) /
    (uCollisionBoundsMax - uCollisionBoundsMin);
  return all(greaterThanEqual(collisionUv, vec3(0.0))) &&
    all(lessThanEqual(collisionUv, vec3(1.0)));
}

// Collision convention: negative inside, zero on surface, positive outside.
float sampleCollisionDistance(vec3 worldPosition) {
  if (!insideCollisionVolume(worldPosition)) return 1000000.0;
  vec3 collisionUv =
    (worldPosition - uCollisionBoundsMin) /
    (uCollisionBoundsMax - uCollisionBoundsMin);
  return texture(uCollisionTexture, collisionUv).r;
}

vec3 calculateCollisionNormal(
  vec3 worldPosition,
  vec3 fallbackMotion
) {
  vec3 stepSize =
    uCollisionVoxelSize * uCollisionGradientStep;
  vec3 gradient = vec3(
    (
      sampleCollisionDistance(
        worldPosition + vec3(stepSize.x, 0.0, 0.0)
      ) -
      sampleCollisionDistance(
        worldPosition - vec3(stepSize.x, 0.0, 0.0)
      )
    ) / (2.0 * stepSize.x),
    (
      sampleCollisionDistance(
        worldPosition + vec3(0.0, stepSize.y, 0.0)
      ) -
      sampleCollisionDistance(
        worldPosition - vec3(0.0, stepSize.y, 0.0)
      )
    ) / (2.0 * stepSize.y),
    (
      sampleCollisionDistance(
        worldPosition + vec3(0.0, 0.0, stepSize.z)
      ) -
      sampleCollisionDistance(
        worldPosition - vec3(0.0, 0.0, stepSize.z)
      )
    ) / (2.0 * stepSize.z)
  );
  float gradientLength = length(gradient);
  if (gradientLength > 0.00001) return gradient / gradientLength;
  float motionLength = length(fallbackMotion);
  return motionLength > 0.00001
    ? -fallbackMotion / motionLength
    : vec3(0.0, 1.0, 0.0);
}
`;

const COLLISION_POSITION_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uPredictedPositionTexture;
uniform sampler2D uCurrentPositionTexture;
uniform float uCollisionEnabled;
uniform float uCollisionRadius;
uniform float uCollisionSkin;
uniform float uCollisionCorrectionStrength;
uniform float uCollisionCorrectionMax;
${COLLISION_SDF_HELPERS}
in vec2 vUv;
out vec4 outColor;

void main() {
  vec4 positionSample =
    texture(uPredictedPositionTexture, vUv);
  vec3 position = positionSample.xyz;
  vec3 currentPosition =
    texture(uCurrentPositionTexture, vUv).xyz;
  float collisionDistance =
    sampleCollisionDistance(position);
  float requiredDistance =
    uCollisionRadius + uCollisionSkin;
  float penetration = requiredDistance - collisionDistance;
  if (penetration > 0.0 && uCollisionEnabled > 0.0) {
    vec3 collisionNormal = calculateCollisionNormal(
      position,
      position - currentPosition
    );
    vec3 correction =
      collisionNormal *
      penetration *
      uCollisionCorrectionStrength;
    float correctionLength = length(correction);
    if (correctionLength > uCollisionCorrectionMax) {
      correction =
        correction / correctionLength * uCollisionCorrectionMax;
    }
    position += correction * uCollisionEnabled;
  }
  outColor = vec4(position, positionSample.a);
}
`;

const COLLISION_VELOCITY_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uPredictedVelocityTexture;
uniform sampler2D uPredictedPositionTexture;
uniform sampler2D uCorrectedPositionTexture;
uniform float uCollisionEnabled;
uniform float uCollisionRadius;
uniform float uCollisionSkin;
uniform float uCollisionRestitution;
uniform float uCollisionFriction;
uniform float uCollisionVelocityThreshold;
uniform float uDeltaTime;
${COLLISION_SDF_HELPERS}
in vec2 vUv;
out vec4 outColor;

void main() {
  vec4 velocitySample =
    texture(uPredictedVelocityTexture, vUv);
  vec3 velocity = velocitySample.xyz;
  vec3 predictedPosition =
    texture(uPredictedPositionTexture, vUv).xyz;
  vec3 correctedPosition =
    texture(uCorrectedPositionTexture, vUv).xyz;
  float predictedDistance =
    sampleCollisionDistance(predictedPosition);
  float requiredDistance =
    uCollisionRadius + uCollisionSkin;
  bool collided = predictedDistance < requiredDistance;
  if (collided && uCollisionEnabled > 0.0) {
    vec3 collisionNormal = calculateCollisionNormal(
      correctedPosition,
      velocity
    );
    float normalSpeed = dot(velocity, collisionNormal);
    vec3 normalVelocity = collisionNormal * normalSpeed;
    vec3 tangentVelocity = velocity - normalVelocity;
    tangentVelocity *= exp(-uCollisionFriction * uDeltaTime);
    if (normalSpeed < -uCollisionVelocityThreshold) {
      normalVelocity =
        collisionNormal *
        (-normalSpeed * uCollisionRestitution);
    } else if (normalSpeed < 0.0) {
      normalVelocity = vec3(0.0);
    }
    vec3 collisionVelocity =
      tangentVelocity + normalVelocity;
    velocity = mix(
      velocity,
      collisionVelocity,
      uCollisionEnabled
    );
  }
  outColor = vec4(velocity, velocitySample.a);
}
`;

const VELOCITY_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform sampler2D uBasePositionTexture;
uniform float uTime;
uniform float uDeltaTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform float uVelocityDamping;
uniform float uActivation;
uniform float uMaxSpeed;
uniform float uOutwardStrength;
uniform vec3 uBodyCenter;
uniform sampler3D uSdfTexture;
uniform vec3 uSdfBoundsMin;
uniform vec3 uSdfBoundsMax;
uniform vec3 uSdfVoxelSize;
uniform float uSurfaceOffset;
uniform float uSurfaceAttraction;
uniform float uSurfaceDamping;
uniform float uSdfGradientStep;
uniform float uSdfForceMax;
uniform float uTangentialFlow;
uniform float uSdfEnabled;
uniform float uVolumeRecoveryStrength;
uniform float uVolumeRecoveryMax;
uniform vec3 uPointerPosition;
uniform vec3 uPointerVelocity;
uniform float uPointerRadius;
uniform float uPointerForce;
uniform float uPointerDragForce;
uniform float uPointerActive;
uniform float uPointerFalloffInner;
uniform float uPointerMaxAcceleration;
uniform float uLocalizedActivityEnabled;
uniform float uPointerActivityRadius;
uniform float uPointerActivityInnerRadius;
uniform float uPointerActivityPower;
uniform float uActiveCurlStrength;
uniform float uActiveDamping;
uniform float uInactiveDamping;
uniform float uInactiveTangentialDamping;
uniform vec3 uPointerNormal;
uniform vec3 uPointerTangent;
uniform vec3 uPointerBitangent;
uniform float uInfinityRadius;
uniform float uInfinityStrength;
uniform float uInfinityRadialStrength;
uniform float uInfinityCenterPull;
uniform float uInfinityThickness;
uniform float uInfinityVerticalScale;
uniform float uInfinitySpeed;
uniform float uInfinityNoiseStrength;
uniform float uInfinityActive;
uniform float uInfinityAccelerationMax;
uniform float uInfinityVelocityMax;
uniform float uPointerRepulsionMultiplier;
uniform float uPointerDragMultiplier;
in vec2 vUv;
out vec4 outColor;

vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float simplexNoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(
    permute(
      permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
      i.y + vec4(0.0, i1.y, i2.y, 1.0)
    ) + i.x + vec4(0.0, i1.x, i2.x, 1.0)
  );
  float n = 1.0 / 7.0;
  vec3 ns = n * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(
    vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
  );
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(
    0.6 - vec4(
      dot(x0, x0),
      dot(x1, x1),
      dot(x2, x2),
      dot(x3, x3)
    ),
    0.0
  );
  m *= m;
  return 42.0 * dot(
    m * m,
    vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))
  );
}

vec3 vectorNoise(vec3 p) {
  return vec3(
    simplexNoise(p),
    simplexNoise(p + vec3(31.416, 17.903, 47.853)),
    simplexNoise(p + vec3(-23.117, 41.731, 11.287))
  );
}

vec3 curlNoise(vec3 p) {
  const float epsilon = 0.08;
  vec3 dx = vec3(epsilon, 0.0, 0.0);
  vec3 dy = vec3(0.0, epsilon, 0.0);
  vec3 dz = vec3(0.0, 0.0, epsilon);
  vec3 x0 = vectorNoise(p - dx);
  vec3 x1 = vectorNoise(p + dx);
  vec3 y0 = vectorNoise(p - dy);
  vec3 y1 = vectorNoise(p + dy);
  vec3 z0 = vectorNoise(p - dz);
  vec3 z1 = vectorNoise(p + dz);
  return vec3(
    y1.z - y0.z - z1.y + z0.y,
    z1.x - z0.x - x1.z + x0.z,
    x1.y - x0.y - y1.x + y0.x
  ) / (2.0 * epsilon);
}

bool isInsideSdfVolume(vec3 worldPosition) {
  vec3 sdfUv =
    (worldPosition - uSdfBoundsMin) /
    (uSdfBoundsMax - uSdfBoundsMin);
  return all(greaterThanEqual(sdfUv, vec3(0.0))) &&
    all(lessThanEqual(sdfUv, vec3(1.0)));
}

// SDF convention: negative inside, zero on surface, positive outside.
float sampleSdf(vec3 worldPosition) {
  vec3 sdfUv =
    (worldPosition - uSdfBoundsMin) /
    (uSdfBoundsMax - uSdfBoundsMin);
  return texture(
    uSdfTexture,
    clamp(sdfUv, vec3(0.0), vec3(1.0))
  ).r;
}

void main() {
  vec3 position = texture(uPositionTexture, vUv).xyz;
  vec4 velocitySample = texture(uVelocityTexture, vUv);
  vec3 velocity = velocitySample.xyz;
  float seed = velocitySample.a;
  vec3 fieldPosition = position * uNoiseScale +
    vec3(uTime * 0.08, -uTime * 0.05, uTime * 0.04);
  fieldPosition += vec3(seed * 3.1, seed * 5.7, seed * 7.9);
  vec3 curl = curlNoise(fieldPosition);
  float curlLength = length(curl);
  if (curlLength > 0.0001) curl /= curlLength;

  float activationEnd = min(seed + 0.18, 1.0);
  float particleActivation = smoothstep(
    seed,
    activationEnd,
    uActivation
  );
  float activityDistance =
    length(position - uPointerPosition);
  float activityMask =
    1.0 -
    smoothstep(
      min(uPointerActivityInnerRadius, uPointerActivityRadius),
      max(uPointerActivityRadius, 0.00001),
      activityDistance
    );
  activityMask = clamp(activityMask, 0.0, 1.0);
  activityMask *= uPointerActive;
  activityMask = pow(
    activityMask,
    max(uPointerActivityPower, 0.00001)
  );
  if (uLocalizedActivityEnabled < 0.5) activityMask = 1.0;
  float infinityActivity = activityMask * uInfinityActive;
  vec3 outwardDirection = position - uBodyCenter;
  float outwardLength = length(outwardDirection);
  if (outwardLength > 0.0001) outwardDirection /= outwardLength;

  vec3 flowDirection = curl;
  vec3 sdfAcceleration = vec3(0.0);
  vec3 surfaceNormal = vec3(0.0, 1.0, 0.0);
  bool insideSdfVolume = isInsideSdfVolume(position);
  if (insideSdfVolume) {
    vec3 gradientStep = uSdfVoxelSize * uSdfGradientStep;
    vec3 gradient = vec3(
      (
        sampleSdf(position + vec3(gradientStep.x, 0.0, 0.0)) -
        sampleSdf(position - vec3(gradientStep.x, 0.0, 0.0))
      ) / (2.0 * gradientStep.x),
      (
        sampleSdf(position + vec3(0.0, gradientStep.y, 0.0)) -
        sampleSdf(position - vec3(0.0, gradientStep.y, 0.0))
      ) / (2.0 * gradientStep.y),
      (
        sampleSdf(position + vec3(0.0, 0.0, gradientStep.z)) -
        sampleSdf(position - vec3(0.0, 0.0, gradientStep.z))
      ) / (2.0 * gradientStep.z)
    );
    float gradientLength = length(gradient);
    surfaceNormal = gradientLength > 0.00001
      ? gradient / gradientLength
      : vec3(0.0, 1.0, 0.0);
    float surfaceError = sampleSdf(position) - uSurfaceOffset;
    sdfAcceleration =
      -surfaceNormal * surfaceError * uSurfaceAttraction;
    float sdfForceLength = length(sdfAcceleration);
    if (sdfForceLength > uSdfForceMax) {
      sdfAcceleration =
        sdfAcceleration / sdfForceLength * uSdfForceMax;
    }
    float normalVelocity = dot(velocity, surfaceNormal);
    float normalDamping = min(
      uSurfaceDamping * uDeltaTime * uSdfEnabled,
      1.0
    );
    velocity -=
      surfaceNormal * normalVelocity * normalDamping;
    vec3 tangentialCurl =
      curl - surfaceNormal * dot(curl, surfaceNormal);
    float tangentLength = length(tangentialCurl);
    if (tangentLength > 0.0001) tangentialCurl /= tangentLength;
    vec3 blendedFlow = mix(
      curl,
      tangentialCurl,
      uTangentialFlow * uSdfEnabled
    );
    float blendedLength = length(blendedFlow);
    if (blendedLength > 0.0001) {
      flowDirection = blendedFlow / blendedLength;
    }
  } else {
    vec3 clampedPosition = clamp(
      position,
      uSdfBoundsMin,
      uSdfBoundsMax
    );
    vec3 recoveryVector = clampedPosition - position;
    float recoveryLength = length(recoveryVector);
    if (recoveryLength > 0.0001) {
      sdfAcceleration =
        recoveryVector / recoveryLength *
        min(
          recoveryLength * uVolumeRecoveryStrength,
          uVolumeRecoveryMax
        );
    }
    flowDirection *= mix(1.0, 0.2, uSdfEnabled);
  }

  vec3 pointerNormal = normalize(uPointerNormal);
  vec3 pointerTangent =
    uPointerTangent -
    pointerNormal * dot(uPointerTangent, pointerNormal);
  float pointerTangentLength = length(pointerTangent);
  pointerTangent = pointerTangentLength > 0.00001
    ? pointerTangent / pointerTangentLength
    : vec3(1.0, 0.0, 0.0);
  vec3 pointerBitangent =
    cross(pointerNormal, pointerTangent);
  float pointerBitangentLength = length(pointerBitangent);
  pointerBitangent = pointerBitangentLength > 0.00001
    ? pointerBitangent / pointerBitangentLength
    : normalize(uPointerBitangent);
  pointerTangent =
    normalize(cross(pointerBitangent, pointerNormal));

  vec3 relative = position - uPointerPosition;
  float localX = dot(relative, pointerTangent);
  float localY = dot(relative, pointerBitangent);
  float localZ = dot(relative, pointerNormal);
  float infinityVerticalScale =
    max(uInfinityVerticalScale, 0.0001);
  float infinityX = localX;
  float infinityY = localY / infinityVerticalScale;
  float infinityRadiusSquared =
    infinityX * infinityX + infinityY * infinityY;
  float infinityASquared = uInfinityRadius * uInfinityRadius;
  float infinityField =
    infinityRadiusSquared * infinityRadiusSquared -
    infinityASquared *
      (infinityX * infinityX - infinityY * infinityY);
  vec2 infinityGradient = vec2(
    4.0 * infinityX * infinityRadiusSquared -
      2.0 * infinityASquared * infinityX,
    4.0 * infinityY * infinityRadiusSquared +
      2.0 * infinityASquared * infinityY
  );
  float infinityGradientLength = length(infinityGradient);
  vec2 curveNormal = infinityGradientLength > 0.00001
    ? infinityGradient / infinityGradientLength
    : vec2(1.0, 0.0);
  vec2 curveTangent =
    vec2(-curveNormal.y, curveNormal.x);
  float centerDistance = length(vec2(infinityX, infinityY));
  float centerMask =
    1.0 -
    smoothstep(
      0.0,
      max(uInfinityRadius * 0.18, 0.00001),
      centerDistance
    );
  vec2 centerDirection = normalize(
    vec2(1.0, sign(infinityX + 0.0001) * 0.35)
  );
  vec2 blendedCurveTangent = mix(
    curveTangent,
    centerDirection,
    centerMask
  );
  float blendedTangentLength = length(blendedCurveTangent);
  curveTangent = blendedTangentLength > 0.00001
    ? blendedCurveTangent / blendedTangentLength
    : centerDirection;
  curveTangent *= uInfinitySpeed;
  float normalizedInfinityField =
    infinityField /
    max(infinityASquared * infinityASquared, 0.00001);
  float curveDistanceSignal = clamp(
    normalizedInfinityField,
    -1.0,
    1.0
  );
  vec2 curveAttraction =
    -curveNormal *
    curveDistanceSignal *
    uInfinityRadialStrength;
  vec3 infinityAcceleration =
    (
      pointerTangent * curveTangent.x +
      pointerBitangent * curveTangent.y
    ) * uInfinityStrength +
    pointerTangent * curveAttraction.x +
    pointerBitangent * curveAttraction.y;
  infinityAcceleration -=
    pointerNormal *
    dot(infinityAcceleration, pointerNormal);
  infinityAcceleration +=
    pointerNormal * (-localZ * uInfinityCenterPull);
  vec3 infinityOrganicNoise = curl;
  infinityOrganicNoise -=
    pointerNormal *
    dot(infinityOrganicNoise, pointerNormal);
  infinityAcceleration +=
    infinityOrganicNoise * uInfinityNoiseStrength;
  float infinityAccelerationLength =
    length(infinityAcceleration);
  if (infinityAccelerationLength > uInfinityAccelerationMax) {
    infinityAcceleration *=
      uInfinityAccelerationMax / infinityAccelerationLength;
  }

  vec3 acceleration = (
    (
      flowDirection * uNoiseStrength * uActiveCurlStrength +
      outwardDirection * uOutwardStrength
    ) * activityMask * (1.0 - uInfinityActive) +
    infinityAcceleration * infinityActivity +
    sdfAcceleration * uSdfEnabled
  ) * particleActivation;
  vec3 pointerDelta = position - uPointerPosition;
  float pointerDistance = length(pointerDelta);
  float pointerInnerRadius =
    uPointerRadius * uPointerFalloffInner;
  float pointerInfluence = uPointerRadius > 0.00001
    ? (
        1.0 -
        smoothstep(
          pointerInnerRadius,
          uPointerRadius,
          pointerDistance
        )
      ) * uPointerActive
    : 0.0;
  vec3 repulsionDirection = pointerDistance > 0.00001
    ? pointerDelta / pointerDistance
    : surfaceNormal;
  vec3 tangentPointerVelocity =
    uPointerVelocity -
    surfaceNormal * dot(uPointerVelocity, surfaceNormal);
  vec3 pointerAcceleration =
    repulsionDirection * pointerInfluence * uPointerForce *
      mix(1.0, uPointerRepulsionMultiplier, uInfinityActive) +
    tangentPointerVelocity * pointerInfluence *
      uPointerDragForce *
      mix(1.0, uPointerDragMultiplier, uInfinityActive);
  float pointerAccelerationLength = length(pointerAcceleration);
  if (pointerAccelerationLength > uPointerMaxAcceleration) {
    pointerAcceleration *=
      uPointerMaxAcceleration / pointerAccelerationLength;
  }
  acceleration += pointerAcceleration * particleActivation;
  velocity += acceleration * uDeltaTime;
  float velocityDamping = uLocalizedActivityEnabled < 0.5
    ? uVelocityDamping
    : mix(uInactiveDamping, uActiveDamping, activityMask);
  velocity *= exp(-velocityDamping * uDeltaTime);
  if (insideSdfVolume) {
    float normalSpeed = dot(velocity, surfaceNormal);
    vec3 normalVelocity = surfaceNormal * normalSpeed;
    vec3 tangentVelocity = velocity - normalVelocity;
    float inactiveAmount = 1.0 - activityMask;
    tangentVelocity *= exp(
      -uInactiveTangentialDamping *
      inactiveAmount *
      uDeltaTime
    );
    velocity = normalVelocity + tangentVelocity;
  }
  float speed = length(velocity);
  float maximumVelocity = mix(
    uMaxSpeed,
    uInfinityVelocityMax,
    uInfinityActive
  );
  if (speed > maximumVelocity) {
    velocity = velocity / speed * maximumVelocity;
  }
  outColor = vec4(velocity, seed);
}
`;

const PROJECT_VERTEX_TEXTURE = `
vec4 mvPosition = vec4(
  transformed + blockParticlePosition,
  1.0
);
mvPosition = modelViewMatrix * mvPosition;
gl_Position = vAimParticleValid > 0.5
  ? projectionMatrix * mvPosition
  : vec4(2.0, 2.0, 2.0, 1.0);
`;

const WORLDPOS_VERTEX_TEXTURE = `
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
  vec4 worldPosition = vec4(
    transformed + blockParticlePosition,
    1.0
  );
  worldPosition = modelMatrix * worldPosition;
#endif
`;

const BEGIN_VERTEX_ORIENTATION = `
vec3 blockParticlePosition;
vec3 blockParticleVelocity;
float blockParticleSeed;
mat3 blockOrientation;
getBlockFrame(
  gl_InstanceID,
  blockParticlePosition,
  blockParticleVelocity,
  blockParticleSeed,
  blockOrientation
);
vAimParticleIndex =
  float(gl_InstanceID) / float(${INSTANCE_COUNT - 1});
vec3 aimBoundsOutside =
  max(uSdfBoundsMin - blockParticlePosition, vec3(0.0)) +
  max(blockParticlePosition - uSdfBoundsMax, vec3(0.0));
vAimBoundsDistance = length(aimBoundsOutside);
vAimSdfDistance = sampleRenderSdf(blockParticlePosition);
vAimParticleValid =
  gl_InstanceID >= 0 &&
  gl_InstanceID < ${INSTANCE_COUNT} &&
  vAimBoundsDistance <= 0.00001
    ? 1.0
    : 0.0;
vec3 aimPointerDelta =
  blockParticlePosition - uAimPointerPosition;
float aimPointerDistance = length(aimPointerDelta);
vAimHoverInfluence = uLocalizedActivityEnabled < 0.5
  ? 1.0
  : (
      pow(
        max(
          0.0,
          1.0 - smoothstep(
            min(uPointerActivityInnerRadius, uPointerActivityRadius),
            max(uPointerActivityRadius, 0.00001),
            aimPointerDistance
          )
        ),
        max(uPointerActivityPower, 0.00001)
      ) * uPointerVisualActivity
    );
ivec2 particleScaleTexel =
  getBlockTexelCoord(gl_InstanceID);
float particleScaleActivity = clamp(
  texelFetch(
    uParticleScaleTexture,
    particleScaleTexel,
    0
  ).r,
  0.0,
  1.0
);
particleScaleActivity = mix(
  vAimHoverInfluence,
  particleScaleActivity,
  uUsePersistentParticleScale
);
particleScaleActivity *= uParticleScaleEnabled;
float particleVisualScale = mix(
  uParticleMinScale,
  uParticleMaxScale,
  particleScaleActivity
);
particleVisualScale *= mix(
  uParticleScaleVariationMin,
  uParticleScaleVariationMax,
  blockParticleSeed
);
vAimScaleActivity = particleScaleActivity;
vAimFinalScale = particleVisualScale;
vec3 localBlockVertex =
  position * uBlockDimensions * particleVisualScale;
float blockLengthVariation = mix(
  1.0 - uLengthVariation,
  1.0 + uLengthVariation,
  blockParticleSeed
);
vec3 infinityDebugRelative =
  blockParticlePosition - uAimPointerPosition;
float infinityDebugX =
  dot(infinityDebugRelative, uInfinityPointerTangent);
float infinityDebugY =
  dot(infinityDebugRelative, uInfinityPointerBitangent) /
  max(uInfinityVerticalScale, 0.0001);
float infinityDebugRadiusSquared =
  infinityDebugX * infinityDebugX +
  infinityDebugY * infinityDebugY;
float infinityDebugASquared =
  uInfinityRadius * uInfinityRadius;
float infinityDebugField =
  infinityDebugRadiusSquared * infinityDebugRadiusSquared -
  infinityDebugASquared *
    (
      infinityDebugX * infinityDebugX -
      infinityDebugY * infinityDebugY
    );
vInfinityCurveDistance = clamp(
  infinityDebugField /
    max(infinityDebugASquared * infinityDebugASquared, 0.00001),
  -1.0,
  1.0
);
vec2 infinityDebugGradient = vec2(
  4.0 * infinityDebugX * infinityDebugRadiusSquared -
    2.0 * infinityDebugASquared * infinityDebugX,
  4.0 * infinityDebugY * infinityDebugRadiusSquared +
    2.0 * infinityDebugASquared * infinityDebugY
);
float infinityDebugGradientLength =
  length(infinityDebugGradient);
vec2 infinityDebugTangent =
  infinityDebugGradientLength > 0.00001
    ? normalize(
        vec2(
          -infinityDebugGradient.y,
          infinityDebugGradient.x
        )
      )
    : vec2(1.0, 0.35);
vInfinityFieldDirection = normalize(
  uInfinityPointerTangent * infinityDebugTangent.x +
  uInfinityPointerBitangent * infinityDebugTangent.y
);
vInfinityCenterMask =
  1.0 -
  smoothstep(
    0.0,
    max(uInfinityRadius * 0.18, 0.00001),
    length(vec2(infinityDebugX, infinityDebugY))
  );
float blockSpeedStretch =
  1.0 +
  min(
    length(blockParticleVelocity) * uSpeedStretch,
    uMaximumStretch
  ) * particleScaleActivity;
localBlockVertex.x *=
  blockLengthVariation * blockSpeedStretch;
vec3 transformed = blockOrientation * localBlockVertex;
vBlockTangent = blockOrientation[0];
vBlockBitangent = blockOrientation[1];
vBlockNormal = blockOrientation[2];
vBlockSpeed = length(blockParticleVelocity);
vAimParticleSeed = blockParticleSeed;
vAimParticleSpeed = vBlockSpeed;
blockParticlePosition +=
  blockOrientation[2] *
  uBlockDimensions.z *
  0.5 *
  uSurfacePivot;

#ifdef USE_ALPHAHASH
  vPosition = transformed + blockParticlePosition;
#endif
`;

const BEGINNORMAL_VERTEX_ORIENTATION = `
vec3 normalParticlePosition;
vec3 normalParticleVelocity;
float normalParticleSeed;
mat3 normalBlockOrientation;
getBlockFrame(
  gl_InstanceID,
  normalParticlePosition,
  normalParticleVelocity,
  normalParticleSeed,
  normalBlockOrientation
);
vec3 objectNormal =
  normalBlockOrientation * vec3(normal);

#ifdef USE_TANGENT
  vec3 objectTangent =
    normalBlockOrientation * vec3(tangent.xyz);
#endif
`;

function calculateWorldSurfaceArea(mesh) {
  const positions = mesh.geometry.getAttribute("position");
  const index = mesh.geometry.getIndex();
  const triangleCount = Math.floor((index?.count || positions.count) / 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const edgeAB = new THREE.Vector3();
  const edgeAC = new THREE.Vector3();
  let area = 0;

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = triangle * 3;
    const aIndex = index ? index.getX(offset) : offset;
    const bIndex = index ? index.getX(offset + 1) : offset + 1;
    const cIndex = index ? index.getX(offset + 2) : offset + 2;
    a.fromBufferAttribute(positions, aIndex).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(positions, bIndex).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(positions, cIndex).applyMatrix4(mesh.matrixWorld);
    edgeAB.subVectors(b, a);
    edgeAC.subVectors(c, a);
    area += edgeAB.cross(edgeAC).length() * 0.5;
  }

  return area;
}

function allocateInstances(entries) {
  const totalArea = entries.reduce((sum, entry) => sum + entry.area, 0);
  if (!Number.isFinite(totalArea) || totalArea <= 0) {
    throw new Error("[BlockSurfaceHuman] Model has no sampleable surface area.");
  }

  // Largest-remainder allocation keeps coverage proportional and totals exact.
  let assigned = 0;
  entries.forEach((entry) => {
    const exactCount = (entry.area / totalArea) * INSTANCE_COUNT;
    entry.count = Math.floor(exactCount);
    entry.remainder = exactCount - entry.count;
    assigned += entry.count;
  });
  entries
    .slice()
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, INSTANCE_COUNT - assigned)
    .forEach((entry) => {
      entry.count += 1;
    });
}

function createSeededRandom(initialSeed) {
  let seed = initialSeed >>> 0;
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export class BlockSurfaceHuman {
  constructor({
    scene,
    modelUrl,
    blockSize = 0.018,
    material = null,
    prepareModel = null,
    onProgress = null,
    renderer = null,
    camera = null,
    debugPositionTexture = false,
    debugSimulation = false,
    simulation = {},
    sdfUrl = null,
    sdfMetadataUrl = null,
    sdf = {},
    debugSdf = false,
    orientation = {},
    debugOrientation = false,
    orientationDebugMode = "none",
    collisionUrl = null,
    collisionMetadataUrl = null,
    collision = {},
    debugCollision = false,
    collisionDebugMode = "none",
    pointer = {},
    pointerDebugMode = "none",
    localizedActivity = {},
    activityDebugMode = "none",
    infinityFlow = {},
    infinityDebugMode = "none",
    particleScaleInteraction = {},
    particleScaleDebugMode = "none",
    innerCrystal = {},
    innerCrystalDebugMode = "crystal+particles",
    particleStateDebugMode = "none",
    particleCollisions = {},
    particleCollisionDebugMode = "none",
    debugVoxelOverflow = false,
    visual = {},
    visualQuality = "desktop",
    materialDebugMode = "none",
  }) {
    this.scene = scene;
    this.modelUrl = modelUrl;
    this.blockSize = blockSize;
    this.material = material;
    this.prepareModel = prepareModel;
    this.onProgress = onProgress;
    this.renderer = renderer;
    this.camera = camera;
    this.debugPositionTexture = debugPositionTexture;
    this.debugSimulation = debugSimulation;
    this.simulationConfig = {
      ...DEFAULT_SIMULATION,
      ...simulation,
    };
    this.sdfUrl = sdfUrl;
    this.sdfMetadataUrl = sdfMetadataUrl;
    this.sdfConfig = { ...DEFAULT_SDF, ...sdf };
    this.debugSdf = debugSdf;
    this.sdfData = null;
    this.sdfMetadata = null;
    this.sdfTexture = null;
    this.sdfInfluence = this.sdfConfig.enabled
      ? THREE.MathUtils.clamp(this.sdfConfig.influence, 0, 1)
      : 0;
    this.sdfInfluenceTarget = this.sdfInfluence;
    this.sdfInfluenceDamping = this.sdfConfig.influenceDamping;
    this._sdfAbortController = null;
    this.orientationConfig = {
      ...DEFAULT_ORIENTATION,
      ...orientation,
    };
    this.orientationInfluence = this.orientationConfig.enabled
      ? THREE.MathUtils.clamp(this.orientationConfig.influence, 0, 1)
      : 0;
    this.debugOrientation = debugOrientation;
    this.orientationDebugMode = orientationDebugMode;
    this.collisionUrl = collisionUrl;
    this.collisionMetadataUrl = collisionMetadataUrl;
    this.collisionConfig = {
      ...DEFAULT_COLLISION,
      ...collision,
    };
    this.collisionInfluence = this.collisionConfig.enabled
      ? THREE.MathUtils.clamp(this.collisionConfig.influence, 0, 1)
      : 0;
    this.debugCollision = debugCollision;
    this.collisionDebugMode = collisionDebugMode;
    this.collisionData = null;
    this.collisionMetadata = null;
    this.collisionTexture = null;
    this._collisionAbortController = null;
    this.pointerConfig = { ...DEFAULT_POINTER, ...pointer };
    this.pointerInteractionEnabled = Boolean(
      this.pointerConfig.enabled,
    );
    this.pointerDebugMode = pointerDebugMode;
    this.localizedActivityConfig = {
      ...DEFAULT_LOCALIZED_ACTIVITY,
      ...localizedActivity,
    };
    this.activityDebugMode = activityDebugMode;
    this.infinityFlowConfig = {
      ...DEFAULT_INFINITY_FLOW,
      ...infinityFlow,
    };
    this.infinityDebugMode = infinityDebugMode;
    if (this.infinityDebugMode === "activity") {
      this.activityDebugMode = "mask";
    }
    this.particleScaleConfig = {
      ...DEFAULT_PARTICLE_SCALE_INTERACTION,
      ...particleScaleInteraction,
    };
    this.particleScaleDebugMode = particleScaleDebugMode;
    this.innerCrystalConfig = {
      ...DEFAULT_INNER_CRYSTAL,
      ...innerCrystal,
    };
    this.innerCrystalDebugMode = innerCrystalDebugMode;
    this.particleStateDebugMode = particleStateDebugMode;
    this.pointerRaycastMeshes = [];
    this.humanRaycastMeshes = [];
    this.humanVisibleMeshes = [];
    this.innerCrystalBackMeshes = [];
    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();
    this.pointerWorldPosition = new THREE.Vector3();
    this.pointerLocalPosition = new THREE.Vector3();
    this.previousPointerLocalPosition = new THREE.Vector3();
    this.pointerVelocity = new THREE.Vector3();
    this.smoothedPointerVelocity = new THREE.Vector3();
    this.pointerLocalNormal = new THREE.Vector3(0, 0, 1);
    this.pointerLocalTangent = new THREE.Vector3(1, 0, 0);
    this.pointerLocalBitangent = new THREE.Vector3(0, 1, 0);
    this._pointerWorldNormal = new THREE.Vector3();
    this._pointerTangentCandidate = new THREE.Vector3();
    this._pointerReferenceAxis = new THREE.Vector3();
    this._pointerNormalMatrix = new THREE.Matrix3();
    this._pointerEffectLinearMatrix = new THREE.Matrix3();
    this._pointerHitWorld = new THREE.Vector3();
    this._pointerDelta = new THREE.Vector3();
    this._pointerVelocityTarget = new THREE.Vector3();
    this._pointerIntersections = [];
    this.pointerActive = false;
    this.pointerHasPreviousHit = false;
    this.pointerNeedsRaycast = false;
    this.latestPointerClientX = 0;
    this.latestPointerClientY = 0;
    this.lastPointerTimestamp = 0;
    this.effectVisible = true;
    this._pointerListenersAttached = false;
    this._onPointerEnter = this._handlePointerMove.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerLeave = this._handlePointerLeave.bind(this);
    this._onPointerCancel = this._handlePointerLeave.bind(this);
    this.particleCollisionConfig = {
      ...DEFAULT_PARTICLE_COLLISIONS,
      ...particleCollisions,
    };
    this.particleCollisionInfluence =
      this.particleCollisionConfig.enabled ? 1 : 0;
    this.particleCollisionDebugMode =
      particleCollisionDebugMode;
    this.debugVoxelOverflow = debugVoxelOverflow;
    const selectedVisualPreset =
      visual.preset || DEFAULT_VISUAL.preset;
    this.visualConfig = {
      ...DEFAULT_VISUAL,
      ...(VISUAL_PRESETS[selectedVisualPreset] || {}),
      ...visual,
      preset: selectedVisualPreset,
    };
    this.visualQuality = visualQuality;
    this.materialDebugMode = materialDebugMode;
    this.pointerVisualActivity = 0;
    this.innerGlassMaterial = null;
    this.innerGlassBackMaterial = null;
    this.innerGlassVisible =
      this.innerCrystalConfig.enabled !== false &&
      this.visualConfig.innerGlassVisible !== false;
    this.particleVoxelKeyTarget = null;
    this.voxelSortTargetA = null;
    this.voxelSortTargetB = null;
    this.currentVoxelSortTarget = null;
    this.voxelStartTarget = null;
    this.voxelEndTarget = null;
    this.particleCollisionPositionTarget = null;
    this.particleScaleTargetA = null;
    this.particleScaleTargetB = null;
    this.currentParticleScaleTarget = null;
    this.nextParticleScaleTarget = null;
    this.particleScaleMaterial = null;
    this.initialParticleScaleTexture = null;
    this.particleCollisionVelocityTarget = null;
    this._particleCollisionPositionStorage = null;
    this._particleCollisionVelocityStorage = null;
    this.particleVoxelKeyMaterial = null;
    this.voxelSortMaterial = null;
    this.voxelRangeMaterial = null;
    this.particleCollisionPositionMaterial = null;
    this.particleCollisionVelocityMaterial = null;
    this.voxelRangeGeometry = null;
    this.voxelRangeScene = null;
    this.voxelRangeMesh = null;
    this.particleCollisionGridResolution = null;
    this.particleCollisionGridBoundsMin = null;
    this.particleCollisionGridBoundsMax = null;
    this.particleCollisionVoxelSize = null;
    this.voxelTextureWidth = 0;
    this.voxelTextureHeight = 0;
    this.particleCollisionMaxNeighbors = 0;
    this.particleCollisionRebuildEveryNFrames = 1;
    this.particleCollisionSubsteps = 1;
    this._particleCollisionFrame = 0;
    this._simulationPassesCurrentFrame = 0;
    this._simulationPassesLastFrame = 0;
    this._scaleSettleElapsed = 0;
    this._particleVoxelDataValid = false;
    this.predictedPositionTarget = null;
    this.predictedVelocityTarget = null;
    this.collisionPositionMaterial = null;
    this.collisionVelocityMaterial = null;
    this.sourceRoot = null;
    this.sourceMeshes = [];
    this.instancedMesh = null;
    this.geometry = null;
    this.positionData = null;
    this.positionTexture = null;
    this.basePositionTexture = null;
    this.positionTextureSize = POSITION_TEXTURE_SIZE;
    this.customDepthMaterial = null;
    this.customDistanceMaterial = null;
    this._shader = null;
    this._depthShader = null;
    this._distanceShader = null;
    this._debugSamplePositions = null;
    this.positionTargetA = null;
    this.positionTargetB = null;
    this.velocityTargetA = null;
    this.velocityTargetB = null;
    this.currentPositionTarget = null;
    this.nextPositionTarget = null;
    this.currentVelocityTarget = null;
    this.nextVelocityTarget = null;
    this.initialVelocityTexture = null;
    this.velocitySimulationMaterial = null;
    this.positionSimulationMaterial = null;
    this.copyMaterial = null;
    this.simulationGeometry = null;
    this.simulationScene = null;
    this.simulationCamera = null;
    this.simulationMesh = null;
    this.simulationProgress = 0;
    this.simulationRunning = false;
    this.autoActivate = false;
    this.simulationInitialized = false;
    this._previousViewport = new THREE.Vector4();
    this._previousScissor = new THREE.Vector4();
    this._previousClearColor = new THREE.Color();
    this._previousClearAlpha = 1;
    this.ownsMaterial = !material;
    this.loadPromise = null;
    this.disposed = false;
  }

  load() {
    if (this.disposed) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Cannot load after disposal."),
      );
    }
    if (this.loadPromise) return this.loadPromise;
    if (!this.renderer?.capabilities.isWebGL2) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Stage 2 requires WebGL2."),
      );
    }
    if (!this.renderer.extensions.has("EXT_color_buffer_float")) {
      return Promise.reject(
        new Error(
          "[BlockSurfaceHuman] Stage 3 requires float color render targets (EXT_color_buffer_float).",
        ),
      );
    }
    if (!this.renderer.extensions.has("OES_texture_float_linear")) {
      return Promise.reject(
        new Error(
          "[BlockSurfaceHuman] Stage 4 requires linear filtering for float SDF textures (OES_texture_float_linear).",
        ),
      );
    }
    if (
      this.orientationConfig.surfacePivot !== "center" &&
      this.orientationConfig.surfacePivot !== "innerFace"
    ) {
      return Promise.reject(
        new Error(
          '[BlockSurfaceHuman] orientation.surfacePivot must be "center" or "innerFace".',
        ),
      );
    }
    if (
      !["none", "normal", "tangent", "bitangent", "speed"].includes(
        this.orientationDebugMode,
      )
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid orientationDebugMode."),
      );
    }
    if (
      ![
        "none",
        "distance",
        "penetration",
        "normal",
        "contact",
      ].includes(this.collisionDebugMode)
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid collisionDebugMode."),
      );
    }
    if (
      !["none", "scale-activity", "final-scale"].includes(
        this.particleScaleDebugMode,
      )
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid particleScaleDebugMode."),
      );
    }
    if (
      ![
        "crystal-only",
        "particles-only",
        "crystal+particles",
      ].includes(this.innerCrystalDebugMode)
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid innerCrystalDebugMode."),
      );
    }
    if (!["front", "double"].includes(this.innerCrystalConfig.side)) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid inner crystal side."),
      );
    }
    if (
      !["none", "influence", "repulsion", "drag"].includes(
        this.pointerDebugMode,
      )
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid pointerDebugMode."),
      );
    }
    if (
      !["none", "mask", "active-only", "velocity"].includes(
        this.activityDebugMode,
      )
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid activityDebugMode."),
      );
    }
    if (
      ![
        "none",
        "basis",
        "activity",
        "field-direction",
        "curve-distance",
        "center",
      ].includes(this.infinityDebugMode)
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid infinityDebugMode."),
      );
    }
    if (
      ![
        "pointer-motion",
        "surface-stable",
        "camera-aligned",
      ].includes(this.infinityFlowConfig.orientationMode)
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid infinity orientation mode."),
      );
    }
    if (
      ![
        "none",
        "index",
        "sdf",
        "bounds",
        "speed",
        "composite",
      ].includes(this.particleStateDebugMode)
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid particleStateDebugMode."),
      );
    }
    if (
      !["off", "mobile", "desktop"].includes(
        this.particleCollisionConfig.quality,
      )
    ) {
      return Promise.reject(
        new Error(
          "[BlockSurfaceHuman] Invalid particle collision quality.",
        ),
      );
    }
    if (!["mobile", "desktop", "high"].includes(this.visualQuality)) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid visualQuality."),
      );
    }
    if (!VISUAL_PRESETS[this.visualConfig.preset]) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid visual preset."),
      );
    }
    if (
      ![
        "none",
        "seed",
        "hover-influence",
        "roughness",
        "fresnel",
        "speed",
      ].includes(this.materialDebugMode)
    ) {
      return Promise.reject(
        new Error("[BlockSurfaceHuman] Invalid materialDebugMode."),
      );
    }
    if (
      !["sum", "average"].includes(
        this.particleCollisionConfig.correctionMode,
      )
    ) {
      return Promise.reject(
        new Error(
          "[BlockSurfaceHuman] Invalid particle collision correctionMode.",
        ),
      );
    }
    if (
      ![
        "none",
        "voxel-key",
        "voxel-occupancy",
        "neighbor-count",
        "penetration",
        "correction",
        "overflow",
      ].includes(this.particleCollisionDebugMode)
    ) {
      return Promise.reject(
        new Error(
          "[BlockSurfaceHuman] Invalid particleCollisionDebugMode.",
        ),
      );
    }
    if (!this.camera) {
      return Promise.reject(
        new Error(
          "[BlockSurfaceHuman] Stage 8 requires the active render camera.",
        ),
      );
    }
    if (!this.collisionUrl || !this.collisionMetadataUrl) {
      return Promise.reject(
        new Error(
          "[BlockSurfaceHuman] Stage 6 requires collisionUrl and collisionMetadataUrl.",
        ),
      );
    }
    this.loadPromise = new GLTFLoader()
      .loadAsync(this.modelUrl, this.onProgress || undefined)
      .then((gltf) => this.build(gltf.scene))
      .catch((error) => {
        this.cleanupPartialLoad();
        this.loadPromise = null;
        throw new Error(
          `[BlockSurfaceHuman] Failed to build block model: ${error.message}`,
          { cause: error },
        );
      });
    return this.loadPromise;
  }

  createAimBlockMaterial() {
    const options = {
      color: new THREE.Color(this.visualConfig.baseColor),
      metalness: THREE.MathUtils.clamp(
        this.visualConfig.metalness,
        0,
        1,
      ),
      roughness: THREE.MathUtils.clamp(
        this.visualConfig.roughness,
        0.08,
        0.75,
      ),
      envMapIntensity: Math.max(
        0,
        this.visualConfig.envMapIntensity,
      ),
      transparent: Boolean(this.visualConfig.transparent),
      opacity: THREE.MathUtils.clamp(
        this.visualConfig.opacity,
        0,
        1,
      ),
      depthTest: true,
      depthWrite: Boolean(this.visualConfig.depthWrite),
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
    };
    if (this.visualQuality === "mobile") {
      return new THREE.MeshStandardMaterial(options);
    }
    return new THREE.MeshPhysicalMaterial({
      ...options,
      clearcoat: THREE.MathUtils.clamp(
        this.visualConfig.clearcoat,
        0,
        1,
      ),
      clearcoatRoughness: THREE.MathUtils.clamp(
        this.visualConfig.clearcoatRoughness,
        0,
        1,
      ),
      reflectivity: 0.55,
      transmission: 0,
    });
  }

  configureInnerGlassMaterial() {
    const importedMaterials = new Set();
    const retainedImportedMaterials = new Set();
    const sourceMeshSet = new Set(this.sourceMeshes);
    this.sourceRoot?.traverse((object) => {
      if (!object.isMesh || sourceMeshSet.has(object)) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => {
        if (material) retainedImportedMaterials.add(material);
      });
    });
    this.sourceMeshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      materials.forEach((material) => {
        if (material) importedMaterials.add(material);
      });
    });
    const crystalConfig = this.innerCrystalConfig;
    this.innerGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(crystalConfig.color),
      metalness: THREE.MathUtils.clamp(
        crystalConfig.metalness,
        0,
        1,
      ),
      roughness: THREE.MathUtils.clamp(
        crystalConfig.roughness,
        0,
        1,
      ),
      clearcoat: THREE.MathUtils.clamp(
        crystalConfig.clearcoat,
        0,
        1,
      ),
      clearcoatRoughness: THREE.MathUtils.clamp(
        crystalConfig.clearcoatRoughness,
        0,
        1,
      ),
      envMapIntensity: Math.max(0, crystalConfig.envMapIntensity),
      transparent: false,
      opacity: 1,
      depthTest: crystalConfig.depthTest !== false,
      depthWrite: true,
      side: THREE.FrontSide,
    });
    this.innerGlassMaterial.name =
      "BlockSurfaceHuman.InnerMetal";

    this.innerCrystalBackMeshes = [];
    this.sourceMeshes.forEach((mesh) => {
      mesh.material = this.innerGlassMaterial;
      mesh.visible =
        this.innerGlassVisible &&
        this.innerCrystalDebugMode !== "particles-only";
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.renderOrder = 1;
    });
    this.humanVisibleMeshes = [...this.sourceMeshes];
    importedMaterials.forEach((material) => {
      if (!retainedImportedMaterials.has(material)) material.dispose();
    });
    debugLog("[BlockSurfaceHuman] Inner crystal initialized", {
      bodyMeshes: this.sourceMeshes.map(
        (mesh) => mesh.name || "unnamed",
      ),
      quality: this.visualQuality,
      debugMode: this.innerCrystalDebugMode,
      settings: {
        color: `#${this.innerGlassMaterial.color.getHexString()}`,
        materialType: this.innerGlassMaterial.type,
        roughness: this.innerGlassMaterial.roughness,
        metalness: this.innerGlassMaterial.metalness,
        clearcoat: this.innerGlassMaterial.clearcoat,
        clearcoatRoughness:
          this.innerGlassMaterial.clearcoatRoughness,
        opacity: this.innerGlassMaterial.opacity,
        transparent: this.innerGlassMaterial.transparent,
        transmission: this.innerGlassMaterial.transmission,
        envMapIntensity: this.innerGlassMaterial.envMapIntensity,
        depthTest: this.innerGlassMaterial.depthTest,
        depthWrite: this.innerGlassMaterial.depthWrite,
        sideConfiguration: "front",
        renderOrder: {
          frontFaces: 1,
          particleBlocks: 2,
        },
      },
      sourceMeshesUsedForRaycasting:
        this.sourceMeshes.every((mesh) =>
          this.humanRaycastMeshes.includes(mesh),
        ),
      duplicateRaycastPasses: false,
    });
  }

  async build(sourceRoot) {
    if (this.disposed) {
      this.disposeSourceRoot(sourceRoot);
      throw new Error("[BlockSurfaceHuman] Disposed before loading completed.");
    }

    this.sourceRoot = sourceRoot;
    this.scene.add(sourceRoot);
    this.prepareModel?.(sourceRoot);
    sourceRoot.updateMatrixWorld(true);

    const entries = [];
    sourceRoot.traverse((object) => {
      if (!object.isMesh) return;
      const positions = object.geometry?.getAttribute("position");
      if (!positions || positions.itemSize < 3 || positions.count < 3) return;
      const area = calculateWorldSurfaceArea(object);
      if (Number.isFinite(area) && area > 0) {
        entries.push({ mesh: object, area, count: 0, remainder: 0 });
      }
    });
    if (!entries.length) {
      throw new Error("[BlockSurfaceHuman] No valid mesh surfaces were found.");
    }

    allocateInstances(entries);
    this.sourceMeshes = entries.map((entry) => entry.mesh);
    this.humanVisibleMeshes = [...this.sourceMeshes];
    this.humanRaycastMeshes = [...this.sourceMeshes];
    this.pointerRaycastMeshes = this.humanRaycastMeshes;
    debugLog("[BlockSurfaceHuman] Valid meshes:", entries.length);
    entries.forEach(({ mesh, count }, index) => {
      debugLog(
        `[BlockSurfaceHuman] Mesh ${index + 1} (${mesh.name || "unnamed"}):`,
        count,
      );
    });

    // Unit cube: local X=tangent/length, Y=bitangent/width, Z=normal/height.
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    if (!this.material) {
      this.material = this.createAimBlockMaterial();
    }
    this.instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      INSTANCE_COUNT,
    );
    this.instancedMesh.name = "BlockSurfaceHuman";
    this.instancedMesh.visible =
      this.innerCrystalDebugMode !== "crystal-only";
    this.instancedMesh.renderOrder = 2;
    this.instancedMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.instancedMesh.frustumCulled = false;
    this.instancedMesh.position.set(0, 0, 0);
    this.instancedMesh.rotation.set(0, 0, 0);
    this.instancedMesh.scale.set(1, 1, 1);
    this.instancedMesh.updateMatrix();
    this.instancedMesh.updateMatrixWorld(true);

    this.positionData = new Float32Array(
      POSITION_TEXTURE_SIZE * POSITION_TEXTURE_SIZE * 4,
    );
    if (this.debugPositionTexture) {
      this._debugSamplePositions = new Map(
        [0, 1024, 2048, 4095].map((index) => [
          index,
          new Float64Array(3),
        ]),
      );
    }
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const worldPosition = new THREE.Vector3();
    const worldNormal = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3();
    const identityQuaternion = new THREE.Quaternion();
    const identityScale = new THREE.Vector3(1, 1, 1);
    const matrix = new THREE.Matrix4();
    const zeroPosition = new THREE.Vector3(0, 0, 0);
    const simulationBounds = new THREE.Box3();
    const surfaceOffset = this.blockSize * 0.25;
    let instanceIndex = 0;

    entries.forEach(({ mesh, count }) => {
      const samplingGeometry = mesh.geometry.index
        ? mesh.geometry.toNonIndexed()
        : mesh.geometry;
      const samplingMesh =
        samplingGeometry === mesh.geometry
          ? mesh
          : new THREE.Mesh(samplingGeometry);
      const sampler = new MeshSurfaceSampler(samplingMesh).build();
      normalMatrix.getNormalMatrix(mesh.matrixWorld);
      for (let sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
        sampler.sample(position, normal);
        // Convert local samples to the shared world space of the instance mesh.
        worldPosition.copy(position).applyMatrix4(mesh.matrixWorld);
        // Inverse-transpose transformation keeps normals correct under scaling.
        worldNormal.copy(normal).applyMatrix3(normalMatrix).normalize();
        worldPosition.addScaledVector(worldNormal, surfaceOffset);
        simulationBounds.expandByPoint(worldPosition);
        const debugPosition = this._debugSamplePositions?.get(instanceIndex);
        if (debugPosition) {
          debugPosition[0] = worldPosition.x;
          debugPosition[1] = worldPosition.y;
          debugPosition[2] = worldPosition.z;
        }
        const textureOffset = instanceIndex * 4;
        this.positionData[textureOffset] = worldPosition.x;
        this.positionData[textureOffset + 1] = worldPosition.y;
        this.positionData[textureOffset + 2] = worldPosition.z;
        this.positionData[textureOffset + 3] = 1;
        matrix.compose(
          zeroPosition,
          identityQuaternion,
          identityScale,
        );
        this.instancedMesh.setMatrixAt(instanceIndex, matrix);
        instanceIndex += 1;
      }
      if (samplingGeometry !== mesh.geometry) samplingGeometry.dispose();
    });

    if (instanceIndex !== INSTANCE_COUNT) {
      throw new Error(
        `[BlockSurfaceHuman] Expected ${INSTANCE_COUNT} instances, created ${instanceIndex}.`,
      );
    }

    this.positionTexture = new THREE.DataTexture(
      this.positionData,
      POSITION_TEXTURE_SIZE,
      POSITION_TEXTURE_SIZE,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    this.positionTexture.minFilter = THREE.NearestFilter;
    this.positionTexture.magFilter = THREE.NearestFilter;
    this.positionTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.positionTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.positionTexture.generateMipmaps = false;
    this.positionTexture.needsUpdate = true;
    this.positionTexture.name = "BlockSurfaceHuman.BasePositions";
    this.basePositionTexture = this.positionTexture;

    await this.loadSdf();
    await this.loadCollisionVolume();
    if (this.disposed) {
      throw new Error(
        "[BlockSurfaceHuman] Disposed while the SDF was loading.",
      );
    }
    this.initializeSimulation(simulationBounds.getCenter(new THREE.Vector3()));
    this.initializeParticleCollisions();
    this.configurePositionMaterial(this.material, "main");
    this.customDepthMaterial = new THREE.MeshDepthMaterial();
    this.customDistanceMaterial = new THREE.MeshDistanceMaterial();
    this.configurePositionMaterial(
      this.customDepthMaterial,
      "depth",
    );
    this.configurePositionMaterial(
      this.customDistanceMaterial,
      "distance",
    );
    this.instancedMesh.customDepthMaterial = this.customDepthMaterial;
    this.instancedMesh.customDistanceMaterial =
      this.customDistanceMaterial;

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedMesh);
    this.configureInnerGlassMaterial();
    this.attachPointerListeners();
    debugLog("[BlockSurfaceHuman] Instances created:", instanceIndex);
    debugLog(
      "[BlockSurfaceHuman] Stage 8 pointer interaction initialized",
      {
        raycastTarget: "original-human-mesh",
        pointerCoordinates: "canvas-relative NDC",
        hitCoordinates: "instanced-mesh-local",
        forcePass: "GPU velocity shader",
        cpuParticleUpdates: false,
      },
    );
    debugLog(
      "[ParticleBodyEffect] localized pointer activity enabled",
      {
        activitySource: "real 3D raycast hit",
        coordinateSpace: "ParticleBodyEffect local",
        curlOutsideRadius: false,
        globalSdfRecovery: true,
        activityTexture: false,
      },
    );
    debugLog("[BlockSurfaceHuman] infinity flow initialized", {
      center: "real 3D raycast hit",
      plane: "surface tangent basis",
      formulation: "implicit Bernoulli lemniscate",
      radius: this.infinityFlowConfig.radius,
      activityRadius: this.localizedActivityConfig.radius,
      gpuOnly: true,
    });
    debugLog(
      "[BlockSurfaceHuman] Stage 10 AIM material initialized",
      {
        material: this.material.type,
        preset: this.visualConfig.preset,
        quality: this.visualQuality,
        blending: "NormalBlending",
        transparent: this.material.transparent,
        depthTest: this.material.depthTest,
        depthWrite: this.material.depthWrite,
        pointerHighlight: true,
        bloom: this.visualConfig.bloomEnabled
          ? "minimal"
          : "disabled",
        innerGlass: this.innerGlassVisible,
      },
    );
    if (this.debugPositionTexture) this.logPositionTextureDiagnostics();
    return this;
  }

  async loadSdf() {
    if (!this.sdfUrl || !this.sdfMetadataUrl) {
      throw new Error(
        "[BlockSurfaceHuman] Stage 4 requires sdfUrl and sdfMetadataUrl.",
      );
    }
    this._sdfAbortController = new AbortController();
    let metadataResponse;
    let binaryResponse;
    try {
      [metadataResponse, binaryResponse] = await Promise.all([
        fetch(this.sdfMetadataUrl, {
          signal: this._sdfAbortController.signal,
        }),
        fetch(this.sdfUrl, {
          signal: this._sdfAbortController.signal,
        }),
      ]);
    } catch (error) {
      throw new Error(
        `[BlockSurfaceHuman] Failed to fetch SDF assets (${this.sdfMetadataUrl}, ${this.sdfUrl}): ${error.message}`,
        { cause: error },
      );
    }
    if (!metadataResponse.ok) {
      throw new Error(
        `[BlockSurfaceHuman] Failed to load SDF metadata ${this.sdfMetadataUrl}: HTTP ${metadataResponse.status}.`,
      );
    }
    if (!binaryResponse.ok) {
      throw new Error(
        `[BlockSurfaceHuman] Failed to load SDF binary ${this.sdfUrl}: HTTP ${binaryResponse.status}.`,
      );
    }

    const [metadata, buffer] = await Promise.all([
      metadataResponse.json(),
      binaryResponse.arrayBuffer(),
    ]);
    const resolution = metadata.resolution;
    if (
      !Array.isArray(resolution) ||
      resolution.length !== 3 ||
      resolution.some(
        (value) => !Number.isInteger(value) || value <= 0,
      )
    ) {
      throw new Error("[BlockSurfaceHuman] Invalid SDF resolution metadata.");
    }
    const expectedBytes =
      resolution[0] * resolution[1] * resolution[2] * 4;
    if (buffer.byteLength !== expectedBytes) {
      throw new Error(
        `[BlockSurfaceHuman] SDF binary size mismatch: expected ${expectedBytes}, received ${buffer.byteLength}.`,
      );
    }
    if (
      metadata.format !== "float32" ||
      metadata.channels !== 1 ||
      metadata.signConvention !==
        "negative-inside-positive-outside"
    ) {
      throw new Error(
        "[BlockSurfaceHuman] Unsupported SDF format or sign convention.",
      );
    }
    if (
      !Array.isArray(metadata.boundsMin) ||
      !Array.isArray(metadata.boundsMax) ||
      !Array.isArray(metadata.voxelSize)
    ) {
      throw new Error("[BlockSurfaceHuman] SDF bounds metadata is missing.");
    }
    const gl = this.renderer.getContext();
    const max3dTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);
    if (resolution.some((value) => value > max3dTextureSize)) {
      throw new Error(
        `[BlockSurfaceHuman] SDF resolution ${resolution.join("x")} exceeds MAX_3D_TEXTURE_SIZE ${max3dTextureSize}.`,
      );
    }

    this.sdfMetadata = metadata;
    this.sdfData = new Float32Array(buffer);
    if (!this.sdfData.every(Number.isFinite)) {
      throw new Error("[BlockSurfaceHuman] SDF contains non-finite values.");
    }
    this.sdfTexture = new THREE.Data3DTexture(
      this.sdfData,
      resolution[0],
      resolution[1],
      resolution[2],
    );
    this.sdfTexture.format = THREE.RedFormat;
    this.sdfTexture.type = THREE.FloatType;
    this.sdfTexture.minFilter = THREE.LinearFilter;
    this.sdfTexture.magFilter = THREE.LinearFilter;
    this.sdfTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.sdfTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.sdfTexture.wrapR = THREE.ClampToEdgeWrapping;
    this.sdfTexture.unpackAlignment = 1;
    this.sdfTexture.generateMipmaps = false;
    this.sdfTexture.needsUpdate = true;
    this.sdfTexture.name = "BlockSurfaceHuman.HumanSdf";

    for (let attempt = 0; attempt < 16; attempt += 1) {
      if (gl.getError() === gl.NO_ERROR) break;
    }
    this.renderer.initTexture(this.sdfTexture);
    const uploadError = gl.getError();
    if (uploadError !== gl.NO_ERROR) {
      throw new Error(
        `[BlockSurfaceHuman] SDF 3D texture upload failed with WebGL error ${uploadError}.`,
      );
    }
    if (this.debugSdf) this.validateSdfSurfaceSamples();
    this._sdfAbortController = null;
  }

  validateSdfSurfaceSamples() {
    const indices = [0, 1024, 2048, 4095];
    const distances = indices.map((instanceIndex) => ({
      instanceIndex,
      distance: this.sampleSdfData(
        this.positionData[instanceIndex * 4],
        this.positionData[instanceIndex * 4 + 1],
        this.positionData[instanceIndex * 4 + 2],
      ),
    }));
    debugLog("[BlockSurfaceHuman] SDF surface validation:", {
      signConvention: "negative-inside-positive-outside",
      boundsMin: this.sdfMetadata.boundsMin,
      boundsMax: this.sdfMetadata.boundsMax,
      distances,
    });
  }

  sampleSdfData(x, y, z) {
    const { resolution, boundsMin, boundsMax } = this.sdfMetadata;
    const coordinates = [x, y, z].map((value, axis) =>
      THREE.MathUtils.clamp(
        Math.round(
          ((value - boundsMin[axis]) /
            (boundsMax[axis] - boundsMin[axis])) *
            (resolution[axis] - 1),
        ),
        0,
        resolution[axis] - 1,
      ),
    );
    const index =
      coordinates[0] +
      resolution[0] *
        (coordinates[1] + resolution[1] * coordinates[2]);
    return this.sdfData[index];
  }

  async loadCollisionVolume() {
    this._collisionAbortController = new AbortController();
    let metadataResponse;
    let binaryResponse;
    try {
      [metadataResponse, binaryResponse] = await Promise.all([
        fetch(this.collisionMetadataUrl, {
          signal: this._collisionAbortController.signal,
        }),
        fetch(this.collisionUrl, {
          signal: this._collisionAbortController.signal,
        }),
      ]);
    } catch (error) {
      throw new Error(
        `[BlockSurfaceHuman] Failed to fetch collision assets (${this.collisionMetadataUrl}, ${this.collisionUrl}): ${error.message}`,
        { cause: error },
      );
    }
    if (!metadataResponse.ok || !binaryResponse.ok) {
      throw new Error(
        `[BlockSurfaceHuman] Collision asset request failed: metadata HTTP ${metadataResponse.status}, binary HTTP ${binaryResponse.status}.`,
      );
    }
    const [metadata, buffer] = await Promise.all([
      metadataResponse.json(),
      binaryResponse.arrayBuffer(),
    ]);
    const resolution = metadata.resolution;
    if (
      !Array.isArray(resolution) ||
      resolution.length !== 3 ||
      resolution.some(
        (value) => !Number.isInteger(value) || value <= 0,
      )
    ) {
      throw new Error(
        "[BlockSurfaceHuman] Invalid collision resolution metadata.",
      );
    }
    const expectedBytes =
      resolution[0] * resolution[1] * resolution[2] * 4;
    if (buffer.byteLength !== expectedBytes) {
      throw new Error(
        `[BlockSurfaceHuman] Collision binary size mismatch: expected ${expectedBytes}, received ${buffer.byteLength}.`,
      );
    }
    if (
      metadata.format !== "float32" ||
      metadata.channels !== 1 ||
      metadata.signConvention !==
        "negative-inside-positive-outside"
    ) {
      throw new Error(
        "[BlockSurfaceHuman] Unsupported collision volume format or sign convention.",
      );
    }
    const gl = this.renderer.getContext();
    const max3dTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);
    if (resolution.some((value) => value > max3dTextureSize)) {
      throw new Error(
        `[BlockSurfaceHuman] Collision resolution ${resolution.join("x")} exceeds MAX_3D_TEXTURE_SIZE ${max3dTextureSize}.`,
      );
    }
    this.collisionMetadata = metadata;
    this.collisionData = new Float32Array(buffer);
    if (!this.collisionData.every(Number.isFinite)) {
      throw new Error(
        "[BlockSurfaceHuman] Collision volume contains non-finite values.",
      );
    }
    this.collisionTexture = new THREE.Data3DTexture(
      this.collisionData,
      resolution[0],
      resolution[1],
      resolution[2],
    );
    this.collisionTexture.format = THREE.RedFormat;
    this.collisionTexture.type = THREE.FloatType;
    this.collisionTexture.minFilter = THREE.LinearFilter;
    this.collisionTexture.magFilter = THREE.LinearFilter;
    this.collisionTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.collisionTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.collisionTexture.wrapR = THREE.ClampToEdgeWrapping;
    this.collisionTexture.unpackAlignment = 1;
    this.collisionTexture.generateMipmaps = false;
    this.collisionTexture.needsUpdate = true;
    this.collisionTexture.name =
      "BlockSurfaceHuman.FloorCollisionVolume";
    for (let attempt = 0; attempt < 16; attempt += 1) {
      if (gl.getError() === gl.NO_ERROR) break;
    }
    this.renderer.initTexture(this.collisionTexture);
    const uploadError = gl.getError();
    if (uploadError !== gl.NO_ERROR) {
      throw new Error(
        `[BlockSurfaceHuman] Collision 3D texture upload failed with WebGL error ${uploadError}.`,
      );
    }
    this._collisionAbortController = null;
    if (this.debugCollision) {
      debugLog("[BlockSurfaceHuman] GPU collision initialized", {
        collisionTexture: "3D float SDF",
        resolution: resolution.join("x"),
        positionalCorrection: true,
        velocityImpulse: true,
        cpuCollisionLoop: false,
      });
    }
  }

  createSimulationTarget(name) {
    const target = new THREE.WebGLRenderTarget(
      POSITION_TEXTURE_SIZE,
      POSITION_TEXTURE_SIZE,
      {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
      },
    );
    target.texture.generateMipmaps = false;
    target.texture.name = name;
    return target;
  }

  createPackedFloatTarget(width, height, name) {
    const target = new THREE.WebGLRenderTarget(width, height, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
    target.texture.generateMipmaps = false;
    target.texture.name = name;
    return target;
  }

  createParticleCollisionUniforms() {
    return {
      uSortedParticleTexture: { value: null },
      uVoxelStartTexture: { value: null },
      uVoxelEndTexture: { value: null },
      uGridBoundsMin: {
        value: this.particleCollisionGridBoundsMin,
      },
      uGridBoundsMax: {
        value: this.particleCollisionGridBoundsMax,
      },
      uGridResolution: {
        value: this.particleCollisionGridResolution,
      },
      uVoxelTextureWidth: { value: this.voxelTextureWidth },
      uMaxNeighbors: {
        value: this.particleCollisionMaxNeighbors,
      },
      uParticleCollisionRadius: {
        value: Math.max(0, this.particleCollisionConfig.radius),
      },
      uParticleCollisionSkin: {
        value: Math.max(0, this.particleCollisionConfig.skin),
      },
      uParticleCollisionEnabled: {
        value: this.particleCollisionInfluence,
      },
    };
  }

  initializeParticleCollisions() {
    const quality = this.particleCollisionConfig.quality;
    if (quality === "off") {
      this.particleCollisionInfluence = 0;
      return;
    }
    const mobile = quality === "mobile";
    const configuredResolution = mobile
      ? this.particleCollisionConfig.mobileGridResolution
      : this.particleCollisionConfig.desktopGridResolution;
    const resolution = configuredResolution.map((value) =>
      THREE.MathUtils.clamp(Math.floor(value), 1, 256),
    );
    this.particleCollisionGridResolution = new THREE.Vector3(
      resolution[0],
      resolution[1],
      resolution[2],
    );
    const padding = Math.max(
      0,
      this.particleCollisionConfig.gridPadding,
    );
    this.particleCollisionGridBoundsMin =
      new THREE.Vector3()
        .fromArray(this.sdfMetadata.boundsMin)
        .addScalar(-padding);
    this.particleCollisionGridBoundsMax =
      new THREE.Vector3()
        .fromArray(this.sdfMetadata.boundsMax)
        .addScalar(padding);
    const minimumVoxelExtent =
      2 * Math.max(0, this.particleCollisionConfig.radius) +
      Math.max(0, this.particleCollisionConfig.skin);
    const gridCenter = new THREE.Vector3()
      .addVectors(
        this.particleCollisionGridBoundsMin,
        this.particleCollisionGridBoundsMax,
      )
      .multiplyScalar(0.5);
    const gridExtent = new THREE.Vector3()
      .subVectors(
        this.particleCollisionGridBoundsMax,
        this.particleCollisionGridBoundsMin,
      );
    gridExtent.x = Math.max(
      gridExtent.x,
      minimumVoxelExtent * resolution[0],
    );
    gridExtent.y = Math.max(
      gridExtent.y,
      minimumVoxelExtent * resolution[1],
    );
    gridExtent.z = Math.max(
      gridExtent.z,
      minimumVoxelExtent * resolution[2],
    );
    this.particleCollisionGridBoundsMin
      .copy(gridCenter)
      .addScaledVector(gridExtent, -0.5);
    this.particleCollisionGridBoundsMax
      .copy(gridCenter)
      .addScaledVector(gridExtent, 0.5);
    this.particleCollisionVoxelSize =
      new THREE.Vector3()
        .subVectors(
          this.particleCollisionGridBoundsMax,
          this.particleCollisionGridBoundsMin,
        )
        .divide(this.particleCollisionGridResolution);
    const voxelCount =
      resolution[0] * resolution[1] * resolution[2];
    this.voxelTextureWidth = THREE.MathUtils.ceilPowerOfTwo(
      Math.ceil(Math.sqrt(voxelCount)),
    );
    this.voxelTextureHeight = Math.ceil(
      voxelCount / this.voxelTextureWidth,
    );
    const maxTextureSize =
      this.renderer.capabilities.maxTextureSize;
    if (
      this.voxelTextureWidth > maxTextureSize ||
      this.voxelTextureHeight > maxTextureSize
    ) {
      throw new Error(
        "[BlockSurfaceHuman] Packed particle voxel texture exceeds MAX_TEXTURE_SIZE.",
      );
    }
    this.particleCollisionMaxNeighbors = THREE.MathUtils.clamp(
      Math.floor(
        mobile
          ? this.particleCollisionConfig.maxNeighborsMobile
          : this.particleCollisionConfig.maxNeighborsDesktop,
      ),
      1,
      24,
    );
    this.particleCollisionRebuildEveryNFrames = Math.max(
      1,
      Math.floor(
        mobile
          ? this.particleCollisionConfig.rebuildEveryNFramesMobile
          : this.particleCollisionConfig.rebuildEveryNFramesDesktop,
      ),
    );
    this.particleCollisionSubsteps = THREE.MathUtils.clamp(
      Math.floor(
        mobile
          ? this.particleCollisionConfig.substepsMobile
          : this.particleCollisionConfig.substepsDesktop,
      ),
      1,
      4,
    );

    this.particleVoxelKeyTarget = this.createSimulationTarget(
      "BlockSurfaceHuman.ParticleVoxelKeys",
    );
    this.voxelSortTargetA = this.createSimulationTarget(
      "BlockSurfaceHuman.VoxelSortA",
    );
    this.voxelSortTargetB = this.createSimulationTarget(
      "BlockSurfaceHuman.VoxelSortB",
    );
    this.voxelStartTarget = this.createPackedFloatTarget(
      this.voxelTextureWidth,
      this.voxelTextureHeight,
      "BlockSurfaceHuman.VoxelStarts",
    );
    this.voxelEndTarget = this.createPackedFloatTarget(
      this.voxelTextureWidth,
      this.voxelTextureHeight,
      "BlockSurfaceHuman.VoxelEnds",
    );
    this.particleCollisionPositionTarget =
      this.createSimulationTarget(
        "BlockSurfaceHuman.ParticleCorrectedPosition",
      );
    this.particleCollisionVelocityTarget =
      this.createSimulationTarget(
        "BlockSurfaceHuman.ParticleCorrectedVelocity",
      );
    this._particleCollisionPositionStorage =
      this.particleCollisionPositionTarget;
    this._particleCollisionVelocityStorage =
      this.particleCollisionVelocityTarget;

    this.particleVoxelKeyMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: PARTICLE_VOXEL_KEY_FRAGMENT_SHADER,
      uniforms: {
        uPositionTexture: { value: null },
        uGridBoundsMin: {
          value: this.particleCollisionGridBoundsMin,
        },
        uGridBoundsMax: {
          value: this.particleCollisionGridBoundsMax,
        },
        uGridResolution: {
          value: this.particleCollisionGridResolution,
        },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.voxelSortMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: PARTICLE_VOXEL_SORT_FRAGMENT_SHADER,
      uniforms: {
        uSortTexture: { value: null },
        uSortStage: { value: 2 },
        uSortPass: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.voxelRangeMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: PARTICLE_VOXEL_RANGE_VERTEX_SHADER,
      fragmentShader: PARTICLE_VOXEL_RANGE_FRAGMENT_SHADER,
      uniforms: {
        uSortedParticleTexture: { value: null },
        uInvalidVoxelKey: { value: voxelCount },
        uVoxelTextureWidth: { value: this.voxelTextureWidth },
        uVoxelTextureHeight: { value: this.voxelTextureHeight },
        uBuildStart: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    const positionUniforms = {
      ...this.createParticleCollisionUniforms(),
      uExternalCorrectedPositionTexture: { value: null },
      uParticleCollisionCorrectionStrength: {
        value: Math.max(
          0,
          this.particleCollisionConfig.correctionStrength,
        ),
      },
      uParticleCollisionCorrectionMax: {
        value: Math.max(
          0,
          this.particleCollisionConfig.correctionMax,
        ),
      },
      uParticleCollisionAverage: {
        value:
          this.particleCollisionConfig.correctionMode === "average"
            ? 1
            : 0,
      },
      uParticleCollisionDebugMode: {
        value: {
          none: 0,
          "voxel-key": 1,
          "voxel-occupancy": 2,
          "neighbor-count": 3,
          penetration: 4,
          correction: 5,
          overflow: 6,
        }[this.particleCollisionDebugMode],
      },
      uVoxelCount: { value: voxelCount },
    };
    this.particleCollisionPositionMaterial =
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: FULLSCREEN_VERTEX_SHADER,
        fragmentShader:
          PARTICLE_COLLISION_POSITION_FRAGMENT_SHADER,
        uniforms: positionUniforms,
        depthTest: false,
        depthWrite: false,
      });
    const velocityUniforms = {
      ...this.createParticleCollisionUniforms(),
      uExternalCorrectedVelocityTexture: { value: null },
      uExternalCorrectedPositionTexture: { value: null },
      uParticleCorrectedPositionTexture: { value: null },
      uParticleRestitution: {
        value: THREE.MathUtils.clamp(
          this.particleCollisionConfig.restitution,
          0,
          1,
        ),
      },
      uParticleFriction: {
        value: Math.max(0, this.particleCollisionConfig.friction),
      },
      uParticleCorrectionVelocityInfluence: {
        value: THREE.MathUtils.clamp(
          this.particleCollisionConfig
            .correctionVelocityInfluence,
          0,
          1,
        ),
      },
      uParticleMaxSpeed: {
        value: this.simulationConfig.maxSpeed,
      },
      uDeltaTime: { value: 0 },
    };
    this.particleCollisionVelocityMaterial =
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: FULLSCREEN_VERTEX_SHADER,
        fragmentShader:
          PARTICLE_COLLISION_VELOCITY_FRAGMENT_SHADER,
        uniforms: velocityUniforms,
        depthTest: false,
        depthWrite: false,
      });
    this.voxelRangeGeometry = new THREE.BufferGeometry();
    this.voxelRangeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        new Float32Array(INSTANCE_COUNT * 3),
        3,
      ),
    );
    this.voxelRangeScene = new THREE.Scene();
    this.voxelRangeMesh = new THREE.Points(
      this.voxelRangeGeometry,
      this.voxelRangeMaterial,
    );
    this.voxelRangeMesh.frustumCulled = false;
    this.voxelRangeScene.add(this.voxelRangeMesh);

    debugLog(
      "[BlockSurfaceHuman] Stage 9 particle collisions initialized",
      {
        enabled: this.particleCollisionInfluence > 0,
        architecture: "bitonic-sort-packed-voxel-ranges",
        logicalGrid: resolution.join("x"),
        packedRangeTexture:
          `${this.voxelTextureWidth}x${this.voxelTextureHeight}`,
        gridBoundsMin:
          this.particleCollisionGridBoundsMin.toArray(),
        gridBoundsMax:
          this.particleCollisionGridBoundsMax.toArray(),
        voxelSize: this.particleCollisionVoxelSize.toArray(),
        sortPasses: 78,
        maxNeighbors: this.particleCollisionMaxNeighbors,
        cpuParticleUpdates: false,
      },
    );
  }

  initializeSimulation(bodyCenter) {
    const initialVelocityData = new Float32Array(INSTANCE_COUNT * 4);
    const random = createSeededRandom(0x41c6ce57);
    for (let index = 0; index < INSTANCE_COUNT; index += 1) {
      initialVelocityData[index * 4 + 3] = random();
    }
    this.initialVelocityTexture = new THREE.DataTexture(
      initialVelocityData,
      POSITION_TEXTURE_SIZE,
      POSITION_TEXTURE_SIZE,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    this.initialVelocityTexture.minFilter = THREE.NearestFilter;
    this.initialVelocityTexture.magFilter = THREE.NearestFilter;
    this.initialVelocityTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.initialVelocityTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.initialVelocityTexture.generateMipmaps = false;
    this.initialVelocityTexture.needsUpdate = true;
    this.initialVelocityTexture.name =
      "BlockSurfaceHuman.InitialVelocities";

    this.positionTargetA = this.createSimulationTarget(
      "BlockSurfaceHuman.PositionA",
    );
    this.positionTargetB = this.createSimulationTarget(
      "BlockSurfaceHuman.PositionB",
    );
    this.velocityTargetA = this.createSimulationTarget(
      "BlockSurfaceHuman.VelocityA",
    );
    this.velocityTargetB = this.createSimulationTarget(
      "BlockSurfaceHuman.VelocityB",
    );
    this.predictedPositionTarget = this.createSimulationTarget(
      "BlockSurfaceHuman.PredictedPosition",
    );
    this.predictedVelocityTarget = this.createSimulationTarget(
      "BlockSurfaceHuman.PredictedVelocity",
    );

    this.simulationGeometry = new THREE.BufferGeometry();
    this.simulationGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [-1, -1, 0, 3, -1, 0, -1, 3, 0],
        3,
      ),
    );
    this.simulationGeometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2),
    );
    this.simulationScene = new THREE.Scene();
    this.simulationCamera = new THREE.OrthographicCamera(
      -1,
      1,
      1,
      -1,
      0,
      1,
    );
    this.copyMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: COPY_FRAGMENT_SHADER,
      uniforms: {
        uSourceTexture: { value: null },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.velocitySimulationMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: VELOCITY_FRAGMENT_SHADER,
      uniforms: {
        uPositionTexture: { value: null },
        uVelocityTexture: { value: null },
        uBasePositionTexture: { value: this.basePositionTexture },
        uTime: { value: 0 },
        uDeltaTime: { value: 0 },
        uNoiseScale: { value: this.simulationConfig.noiseScale },
        uNoiseStrength: { value: this.simulationConfig.noiseStrength },
        uVelocityDamping: {
          value: this.simulationConfig.velocityDamping,
        },
        uActivation: { value: 0 },
        uMaxSpeed: { value: this.simulationConfig.maxSpeed },
        uOutwardStrength: {
          value: this.simulationConfig.outwardStrength,
        },
        uBodyCenter: { value: bodyCenter },
        uSdfTexture: { value: this.sdfTexture },
        uSdfBoundsMin: {
          value: new THREE.Vector3().fromArray(
            this.sdfMetadata.boundsMin,
          ),
        },
        uSdfBoundsMax: {
          value: new THREE.Vector3().fromArray(
            this.sdfMetadata.boundsMax,
          ),
        },
        uSdfVoxelSize: {
          value: new THREE.Vector3().fromArray(
            this.sdfMetadata.voxelSize,
          ),
        },
        uSurfaceOffset: { value: this.sdfConfig.surfaceOffset },
        uSurfaceAttraction: {
          value: this.sdfConfig.surfaceAttraction,
        },
        uSurfaceDamping: { value: this.sdfConfig.surfaceDamping },
        uSdfGradientStep: { value: this.sdfConfig.gradientStep },
        uSdfForceMax: { value: this.sdfConfig.forceMax },
        uTangentialFlow: { value: this.sdfConfig.tangentialFlow },
        uSdfEnabled: { value: this.sdfInfluence },
        uVolumeRecoveryStrength: {
          value: this.sdfConfig.volumeRecoveryStrength,
        },
        uVolumeRecoveryMax: {
          value: this.sdfConfig.volumeRecoveryMax,
        },
        uPointerPosition: { value: new THREE.Vector3() },
        uPointerVelocity: { value: new THREE.Vector3() },
        uPointerRadius: {
          value: Math.max(0, this.pointerConfig.radius),
        },
        uPointerForce: { value: this.pointerConfig.force },
        uPointerDragForce: {
          value: this.pointerConfig.dragForce,
        },
        uPointerActive: { value: 0 },
        uPointerFalloffInner: {
          value: THREE.MathUtils.clamp(
            this.pointerConfig.falloffInner,
            0,
            0.999,
          ),
        },
        uPointerMaxAcceleration: {
          value: Math.max(0, this.pointerConfig.maxAcceleration),
        },
        uLocalizedActivityEnabled: {
          value: this.localizedActivityConfig.enabled ? 1 : 0,
        },
        uPointerActivityRadius: {
          value: Math.max(0, this.localizedActivityConfig.radius),
        },
        uPointerActivityInnerRadius: {
          value: Math.max(0, this.localizedActivityConfig.innerRadius),
        },
        uPointerActivityPower: {
          value: Math.max(0.00001, this.localizedActivityConfig.power),
        },
        uActiveCurlStrength: {
          value: Math.max(
            0,
            this.localizedActivityConfig.activeCurlStrength,
          ),
        },
        uActiveDamping: {
          value: Math.max(
            0,
            this.localizedActivityConfig.activeDamping,
          ),
        },
        uInactiveDamping: {
          value: Math.max(
            0,
            this.localizedActivityConfig.inactiveDamping,
          ),
        },
        uInactiveTangentialDamping: {
          value: Math.max(
            0,
            this.localizedActivityConfig.inactiveTangentialDamping,
          ),
        },
        uPointerNormal: { value: this.pointerLocalNormal },
        uPointerTangent: { value: this.pointerLocalTangent },
        uPointerBitangent: { value: this.pointerLocalBitangent },
        uInfinityRadius: {
          value: Math.max(0.0001, this.infinityFlowConfig.radius),
        },
        uInfinityStrength: {
          value: Math.max(0, this.infinityFlowConfig.strength),
        },
        uInfinityRadialStrength: {
          value: Math.max(
            0,
            this.infinityFlowConfig.radialStrength,
          ),
        },
        uInfinityCenterPull: {
          value: Math.max(0, this.infinityFlowConfig.centerPull),
        },
        uInfinityThickness: {
          value: Math.max(0, this.infinityFlowConfig.thickness),
        },
        uInfinityVerticalScale: {
          value: Math.max(
            0.0001,
            this.infinityFlowConfig.verticalScale,
          ),
        },
        uInfinitySpeed: {
          value: this.infinityFlowConfig.speed,
        },
        uInfinityNoiseStrength: {
          value: Math.max(
            0,
            this.infinityFlowConfig.noiseStrength,
          ),
        },
        uInfinityActive: {
          value: this.infinityFlowConfig.enabled ? 1 : 0,
        },
        uInfinityAccelerationMax: {
          value: Math.max(
            0.0001,
            this.infinityFlowConfig.accelerationMax,
          ),
        },
        uInfinityVelocityMax: {
          value: Math.max(
            0.0001,
            this.infinityFlowConfig.velocityMax,
          ),
        },
        uPointerRepulsionMultiplier: {
          value: THREE.MathUtils.clamp(
            this.infinityFlowConfig.pointerRepulsionMultiplier,
            0,
            1,
          ),
        },
        uPointerDragMultiplier: {
          value: THREE.MathUtils.clamp(
            this.infinityFlowConfig.pointerDragMultiplier,
            0,
            1,
          ),
        },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.positionSimulationMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: POSITION_FRAGMENT_SHADER,
      uniforms: {
        uPositionTexture: { value: null },
        uVelocityTexture: { value: null },
        uDeltaTime: { value: 0 },
        uActivation: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.particleScaleTargetA = this.createSimulationTarget(
      "BlockSurfaceHuman.ParticleScaleA",
    );
    this.particleScaleTargetB = this.createSimulationTarget(
      "BlockSurfaceHuman.ParticleScaleB",
    );
    this.initialParticleScaleTexture = new THREE.DataTexture(
      new Float32Array(INSTANCE_COUNT * 4),
      POSITION_TEXTURE_SIZE,
      POSITION_TEXTURE_SIZE,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    this.initialParticleScaleTexture.minFilter = THREE.NearestFilter;
    this.initialParticleScaleTexture.magFilter = THREE.NearestFilter;
    this.initialParticleScaleTexture.generateMipmaps = false;
    this.initialParticleScaleTexture.needsUpdate = true;
    this.initialParticleScaleTexture.name =
      "BlockSurfaceHuman.InitialParticleScaleActivity";
    this.particleScaleMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: PARTICLE_SCALE_FRAGMENT_SHADER,
      uniforms: {
        uPreviousScaleTexture: {
          value: this.initialParticleScaleTexture,
        },
        uPositionTexture: { value: this.basePositionTexture },
        uPointerPosition: { value: this.pointerLocalPosition },
        uPointerActive: { value: 0 },
        uPointerActivityInnerRadius: {
          value: this.localizedActivityConfig.innerRadius,
        },
        uPointerActivityRadius: {
          value: this.localizedActivityConfig.radius,
        },
        uPointerActivityPower: {
          value: this.localizedActivityConfig.power,
        },
        uScaleAttack: {
          value: Math.max(0, this.particleScaleConfig.attack),
        },
        uScaleRelease: {
          value: Math.max(0, this.particleScaleConfig.release),
        },
        uDeltaTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const collisionBoundsMin = new THREE.Vector3().fromArray(
      this.collisionMetadata.boundsMin,
    );
    const collisionBoundsMax = new THREE.Vector3().fromArray(
      this.collisionMetadata.boundsMax,
    );
    const collisionVoxelSize = new THREE.Vector3().fromArray(
      this.collisionMetadata.voxelSize,
    );
    this.collisionPositionMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: COLLISION_POSITION_FRAGMENT_SHADER,
      uniforms: {
        uPredictedPositionTexture: { value: null },
        uCurrentPositionTexture: { value: null },
        uCollisionTexture: { value: this.collisionTexture },
        uCollisionBoundsMin: { value: collisionBoundsMin },
        uCollisionBoundsMax: { value: collisionBoundsMax },
        uCollisionVoxelSize: { value: collisionVoxelSize },
        uCollisionEnabled: { value: this.collisionInfluence },
        uCollisionRadius: {
          value: this.collisionConfig.radius,
        },
        uCollisionSkin: { value: this.collisionConfig.skin },
        uCollisionCorrectionStrength: {
          value: this.collisionConfig.correctionStrength,
        },
        uCollisionCorrectionMax: {
          value: this.collisionConfig.correctionMax,
        },
        uCollisionGradientStep: {
          value: this.collisionConfig.gradientStep,
        },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.collisionVelocityMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: COLLISION_VELOCITY_FRAGMENT_SHADER,
      uniforms: {
        uPredictedVelocityTexture: { value: null },
        uPredictedPositionTexture: { value: null },
        uCorrectedPositionTexture: { value: null },
        uCollisionTexture: { value: this.collisionTexture },
        uCollisionBoundsMin: { value: collisionBoundsMin },
        uCollisionBoundsMax: { value: collisionBoundsMax },
        uCollisionVoxelSize: { value: collisionVoxelSize },
        uCollisionEnabled: { value: this.collisionInfluence },
        uCollisionRadius: {
          value: this.collisionConfig.radius,
        },
        uCollisionSkin: { value: this.collisionConfig.skin },
        uCollisionRestitution: {
          value: THREE.MathUtils.clamp(
            this.collisionConfig.restitution,
            0,
            1,
          ),
        },
        uCollisionFriction: {
          value: Math.max(0, this.collisionConfig.friction),
        },
        uCollisionGradientStep: {
          value: this.collisionConfig.gradientStep,
        },
        uCollisionVelocityThreshold: {
          value: this.collisionConfig.velocityThreshold,
        },
        uDeltaTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.simulationMesh = new THREE.Mesh(
      this.simulationGeometry,
      this.copyMaterial,
    );
    this.simulationMesh.frustumCulled = false;
    this.simulationScene.add(this.simulationMesh);

    this.withPreservedRendererState(() => {
      this.copyTextureToTarget(
        this.basePositionTexture,
        this.positionTargetA,
      );
      this.copyTextureToTarget(
        this.basePositionTexture,
        this.positionTargetB,
      );
      this.copyTextureToTarget(
        this.initialVelocityTexture,
        this.velocityTargetA,
      );
      this.copyTextureToTarget(
        this.initialVelocityTexture,
        this.velocityTargetB,
      );
      this.copyTextureToTarget(
        this.initialParticleScaleTexture,
        this.particleScaleTargetA,
      );
      this.copyTextureToTarget(
        this.initialParticleScaleTexture,
        this.particleScaleTargetB,
      );
      if (this._particleCollisionPositionStorage) {
        this.copyTextureToTarget(
          this.basePositionTexture,
          this._particleCollisionPositionStorage,
        );
        this.copyTextureToTarget(
          this.initialVelocityTexture,
          this._particleCollisionVelocityStorage,
        );
      }
    });

    this.currentPositionTarget = this.positionTargetA;
    this.nextPositionTarget = this.positionTargetB;
    this.currentVelocityTarget = this.velocityTargetA;
    this.nextVelocityTarget = this.velocityTargetB;
    this.currentParticleScaleTarget = this.particleScaleTargetA;
    this.nextParticleScaleTarget = this.particleScaleTargetB;
    this.particleCollisionPositionTarget =
      this._particleCollisionPositionStorage;
    this.particleCollisionVelocityTarget =
      this._particleCollisionVelocityStorage;
    this.simulationInitialized = true;

    if (this.debugSimulation) {
      debugLog("[BlockSurfaceHuman] GPU simulation initialized", {
        resolution: "64x64",
        particles: INSTANCE_COUNT,
        positionTargets: 2,
        velocityTargets: 2,
        pingPong: true,
        curlNoise: true,
        sdf: true,
        sdfResolution: this.sdfMetadata.resolution.join("x"),
      });
    }
    debugLog(
      "[BlockSurfaceHuman] Stage 7 orientation initialized",
      {
        method: "vertex-tbn",
        normalSource: "human SDF gradient",
        tangentSource: "post-collision projected velocity",
        rotationRenderTarget: false,
        cpuInstanceUpdates: false,
      },
    );
  }

  withPreservedRendererState(callback) {
    const previousRenderTarget = this.renderer.getRenderTarget();
    const previousAutoClear = this.renderer.autoClear;
    const previousScissorTest = this.renderer.getScissorTest();
    this.renderer.getClearColor(this._previousClearColor);
    this._previousClearAlpha = this.renderer.getClearAlpha();
    this.renderer.getViewport(this._previousViewport);
    this.renderer.getScissor(this._previousScissor);
    try {
      this.renderer.autoClear = true;
      this.renderer.setScissorTest(false);
      callback();
    } finally {
      this.renderer.setRenderTarget(previousRenderTarget);
      this.renderer.setViewport(this._previousViewport);
      this.renderer.setScissor(this._previousScissor);
      this.renderer.setScissorTest(previousScissorTest);
      this.renderer.setClearColor(
        this._previousClearColor,
        this._previousClearAlpha,
      );
      this.renderer.autoClear = previousAutoClear;
    }
  }

  renderSimulationPass(material, target) {
    this._simulationPassesCurrentFrame += 1;
    this.simulationMesh.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.simulationScene, this.simulationCamera);
    const gl = this.renderer.getContext();
    if (
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
      gl.FRAMEBUFFER_COMPLETE
    ) {
      throw new Error(
        `[BlockSurfaceHuman] Incomplete float framebuffer: ${target.texture.name}.`,
      );
    }
  }

  copyTextureToTarget(texture, target) {
    this.copyMaterial.uniforms.uSourceTexture.value = texture;
    this.renderSimulationPass(this.copyMaterial, target);
  }

  renderVoxelRangeBoundary(target, buildStart) {
    this.voxelRangeMaterial.uniforms.uBuildStart.value =
      buildStart ? 1 : 0;
    this.renderer.setRenderTarget(target);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear(true, false, false);
    this.renderer.render(
      this.voxelRangeScene,
      this.simulationCamera,
    );
    const gl = this.renderer.getContext();
    if (
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
      gl.FRAMEBUFFER_COMPLETE
    ) {
      throw new Error(
        `[BlockSurfaceHuman] Incomplete particle voxel range framebuffer: ${target.texture.name}.`,
      );
    }
  }

  rebuildParticleVoxelStructure(positionTexture) {
    if (!this.particleVoxelKeyMaterial) return;
    this.particleVoxelKeyMaterial.uniforms.uPositionTexture.value =
      positionTexture;
    this.renderSimulationPass(
      this.particleVoxelKeyMaterial,
      this.particleVoxelKeyTarget,
    );
    let sourceTexture = this.particleVoxelKeyTarget.texture;
    let destinationTarget = this.voxelSortTargetA;
    for (
      let sortStage = 2;
      sortStage <= INSTANCE_COUNT;
      sortStage *= 2
    ) {
      for (
        let sortPass = sortStage / 2;
        sortPass >= 1;
        sortPass /= 2
      ) {
        this.voxelSortMaterial.uniforms.uSortTexture.value =
          sourceTexture;
        this.voxelSortMaterial.uniforms.uSortStage.value =
          sortStage;
        this.voxelSortMaterial.uniforms.uSortPass.value =
          sortPass;
        this.renderSimulationPass(
          this.voxelSortMaterial,
          destinationTarget,
        );
        sourceTexture = destinationTarget.texture;
        destinationTarget =
          destinationTarget === this.voxelSortTargetA
            ? this.voxelSortTargetB
            : this.voxelSortTargetA;
      }
    }
    this.currentVoxelSortTarget =
      sourceTexture === this.voxelSortTargetA.texture
        ? this.voxelSortTargetA
        : this.voxelSortTargetB;
    this.voxelRangeMaterial.uniforms.uSortedParticleTexture.value =
      sourceTexture;
    this.renderVoxelRangeBoundary(this.voxelStartTarget, true);
    this.renderVoxelRangeBoundary(this.voxelEndTarget, false);
    this._particleVoxelDataValid = true;
  }

  syncParticleCollisionLookupUniforms(material) {
    const uniforms = material.uniforms;
    uniforms.uSortedParticleTexture.value =
      this.currentVoxelSortTarget.texture;
    uniforms.uVoxelStartTexture.value =
      this.voxelStartTarget.texture;
    uniforms.uVoxelEndTexture.value =
      this.voxelEndTarget.texture;
    uniforms.uParticleCollisionEnabled.value =
      this.particleCollisionInfluence;
  }

  getRenderPositionTexture() {
    return (
      this.currentPositionTarget?.texture || this.basePositionTexture
    );
  }

  attachPointerListeners() {
    const canvas = this.renderer?.domElement;
    if (!canvas || this._pointerListenersAttached) return;
    canvas.addEventListener("pointerenter", this._onPointerEnter);
    canvas.addEventListener("pointermove", this._onPointerMove);
    canvas.addEventListener("pointerleave", this._onPointerLeave);
    canvas.addEventListener("pointercancel", this._onPointerCancel);
    this._pointerListenersAttached = true;
  }

  detachPointerListeners() {
    const canvas = this.renderer?.domElement;
    if (!canvas || !this._pointerListenersAttached) return;
    canvas.removeEventListener("pointerenter", this._onPointerEnter);
    canvas.removeEventListener("pointermove", this._onPointerMove);
    canvas.removeEventListener("pointerleave", this._onPointerLeave);
    canvas.removeEventListener("pointercancel", this._onPointerCancel);
    this._pointerListenersAttached = false;
  }

  _handlePointerMove(event) {
    if (
      event.isPrimary === false ||
      !this.pointerInteractionEnabled ||
      !this.effectVisible ||
      this.disposed
    ) {
      return;
    }
    if (
      event.clientX === this.latestPointerClientX &&
      event.clientY === this.latestPointerClientY &&
      this.pointerNeedsRaycast
    ) {
      return;
    }
    this.latestPointerClientX = event.clientX;
    this.latestPointerClientY = event.clientY;
    this.pointerNeedsRaycast = true;
  }

  _handlePointerLeave(event) {
    if (event?.isPrimary === false) return;
    this.clearPointerInteraction();
    this._particleCollisionFrame = 0;
    this._particleVoxelDataValid = false;
  }

  clearPointerInteraction() {
    this.pointerActive = false;
    this.pointerHasPreviousHit = false;
    this.pointerNeedsRaycast = false;
    this.lastPointerTimestamp = 0;
    this.pointerVelocity.set(0, 0, 0);
    this.smoothedPointerVelocity.set(0, 0, 0);
    if (this.velocitySimulationMaterial) {
      this.velocitySimulationMaterial.uniforms.uPointerActive.value = 0;
      this.velocitySimulationMaterial.uniforms.uPointerVelocity.value.set(
        0,
        0,
        0,
      );
    }
  }

  _updatePointerRaycast() {
    this.pointerNeedsRaycast = false;
    const canvas = this.renderer?.domElement;
    if (
      !canvas ||
      !this.camera ||
      !this.instancedMesh ||
      !this.pointerInteractionEnabled ||
      !this.effectVisible
    ) {
      this.clearPointerInteraction();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      this.clearPointerInteraction();
      return;
    }
    const canvasX = this.latestPointerClientX - rect.left;
    const canvasY = this.latestPointerClientY - rect.top;
    this.pointerNdc.set(
      (canvasX / rect.width) * 2 - 1,
      -(canvasY / rect.height) * 2 + 1,
    );
    this.camera.updateMatrixWorld();
    this.sourceRoot?.updateWorldMatrix(true, true);
    this.instancedMesh.updateWorldMatrix(true, false);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    this._pointerIntersections.length = 0;
    this.raycaster.intersectObjects(
      this.pointerRaycastMeshes,
      this.pointerConfig.raycastRecursive,
      this._pointerIntersections,
    );
    const hit = this._pointerIntersections[0];
    if (
      !hit?.point ||
      !Number.isFinite(hit.point.x) ||
      !Number.isFinite(hit.point.y) ||
      !Number.isFinite(hit.point.z)
    ) {
      this.pointerActive = false;
      this.pointerHasPreviousHit = false;
      this.pointerVelocity.set(0, 0, 0);
      this.smoothedPointerVelocity.set(0, 0, 0);
      this.lastPointerTimestamp = 0;
      if (this.velocitySimulationMaterial) {
        this.velocitySimulationMaterial.uniforms.uPointerActive.value =
          0;
        this.velocitySimulationMaterial.uniforms.uPointerVelocity.value
          .set(0, 0, 0);
      }
      return;
    }

    this._pointerHitWorld.copy(hit.point);
    this.pointerWorldPosition.copy(this._pointerHitWorld);
    this.pointerLocalPosition.copy(this._pointerHitWorld);
    this.instancedMesh.worldToLocal(this.pointerLocalPosition);
    const now = performance.now();
    const deltaSeconds = this.lastPointerTimestamp
      ? Math.max((now - this.lastPointerTimestamp) / 1000, 1 / 240)
      : 1 / 60;
    if (this.pointerHasPreviousHit) {
      this._pointerVelocityTarget
        .copy(this.pointerLocalPosition)
        .sub(this.previousPointerLocalPosition)
        .divideScalar(deltaSeconds);
      const maxVelocity = Math.max(0, this.pointerConfig.maxVelocity);
      if (
        this._pointerVelocityTarget.lengthSq() >
        maxVelocity * maxVelocity
      ) {
        this._pointerVelocityTarget.setLength(maxVelocity);
      }
      this.pointerVelocity.copy(this._pointerVelocityTarget);
      const alpha =
        1 -
        Math.exp(
          -Math.max(0, this.pointerConfig.velocitySmoothing) *
            deltaSeconds,
        );
      this.smoothedPointerVelocity.lerp(this.pointerVelocity, alpha);
    } else {
      this.pointerVelocity.set(0, 0, 0);
      this.smoothedPointerVelocity.set(0, 0, 0);
    }
    this._updatePointerBasis(hit);
    this.previousPointerLocalPosition.copy(this.pointerLocalPosition);
    this.lastPointerTimestamp = now;
    this.pointerHasPreviousHit = true;
    this.pointerActive = true;
  }

  _updatePointerBasis(hit) {
    if (hit.face?.normal && hit.object) {
      this._pointerNormalMatrix.getNormalMatrix(
        hit.object.matrixWorld,
      );
      this._pointerWorldNormal
        .copy(hit.face.normal)
        .applyMatrix3(this._pointerNormalMatrix)
        .normalize();
      this._pointerEffectLinearMatrix
        .setFromMatrix4(this.instancedMesh.matrixWorld)
        .transpose();
      this.pointerLocalNormal
        .copy(this._pointerWorldNormal)
        .applyMatrix3(this._pointerEffectLinearMatrix)
        .normalize();
    }

    const normal = this.pointerLocalNormal;
    const tangent = this._pointerTangentCandidate;
    const mode = this.infinityFlowConfig.orientationMode;
    if (mode === "camera-aligned") {
      const cameraElements = this.camera.matrixWorld.elements;
      tangent.set(
        cameraElements[0],
        cameraElements[1],
        cameraElements[2],
      );
      this._pointerEffectLinearMatrix
        .setFromMatrix4(this.instancedMesh.matrixWorld)
        .invert();
      tangent.applyMatrix3(this._pointerEffectLinearMatrix);
    } else if (mode === "surface-stable") {
      tangent.copy(this.pointerLocalTangent);
    } else {
      tangent.copy(this.smoothedPointerVelocity);
    }
    tangent.addScaledVector(normal, -tangent.dot(normal));

    const threshold = Math.max(
      0,
      this.infinityFlowConfig.tangentVelocityThreshold,
    );
    if (tangent.lengthSq() <= threshold * threshold) {
      tangent
        .copy(this.pointerLocalTangent)
        .addScaledVector(
          normal,
          -this.pointerLocalTangent.dot(normal),
        );
    }
    if (tangent.lengthSq() <= 1e-10) {
      this._pointerReferenceAxis.set(
        Math.abs(normal.y) < 0.9 ? 0 : 1,
        Math.abs(normal.y) < 0.9 ? 1 : 0,
        0,
      );
      tangent.crossVectors(this._pointerReferenceAxis, normal);
    }
    tangent.normalize();
    if (tangent.dot(this.pointerLocalTangent) < 0) {
      tangent.multiplyScalar(-1);
    }
    this.pointerLocalTangent.copy(tangent);
    this.pointerLocalBitangent
      .crossVectors(normal, this.pointerLocalTangent)
      .normalize();
    this.pointerLocalTangent
      .crossVectors(this.pointerLocalBitangent, normal)
      .normalize();
  }

  syncPointerUniforms() {
    if (!this.velocitySimulationMaterial) return;
    const uniforms = this.velocitySimulationMaterial.uniforms;
    uniforms.uPointerPosition.value.copy(this.pointerLocalPosition);
    uniforms.uPointerVelocity.value.copy(this.smoothedPointerVelocity);
    uniforms.uPointerNormal.value.copy(this.pointerLocalNormal);
    uniforms.uPointerTangent.value.copy(this.pointerLocalTangent);
    uniforms.uPointerBitangent.value.copy(
      this.pointerLocalBitangent,
    );
    uniforms.uPointerActive.value =
      this.pointerInteractionEnabled &&
      this.pointerActive &&
      this.effectVisible
        ? 1
        : 0;
    if (this._shader?.uniforms.uDebugPointerActive) {
      this._shader.uniforms.uDebugPointerActive.value =
        uniforms.uPointerActive.value;
      this._shader.uniforms.uDebugPointerRadius.value =
        uniforms.uPointerRadius.value;
    }
  }

  syncVisualUniforms(deltaTime) {
    this.pointerVisualActivity =
      this.pointerActive &&
      this.pointerInteractionEnabled &&
      this.effectVisible
        ? 1
        : 0;
    [this._shader, this._depthShader, this._distanceShader].forEach(
      (shader) => {
        if (!shader) return;
        shader.uniforms.uPointerVisualActivity.value =
          this.pointerVisualActivity;
        shader.uniforms.uAimPointerRadius.value =
          this.pointerConfig.radius;
        shader.uniforms.uPointerActivityRadius.value =
          this.localizedActivityConfig.radius;
        shader.uniforms.uPointerActivityInnerRadius.value =
          this.localizedActivityConfig.innerRadius;
        shader.uniforms.uPointerActivityPower.value =
          this.localizedActivityConfig.power;
        shader.uniforms.uLocalizedActivityEnabled.value =
          this.localizedActivityConfig.enabled ? 1 : 0;
      },
    );
  }

  update(deltaTime, elapsedTime) {
    this._simulationPassesCurrentFrame = 0;
    this._simulationPassesLastFrame = 0;
    if (
      !this.simulationInitialized ||
      this.disposed ||
      document.hidden
    ) {
      this.clearPointerInteraction();
      this._simulationPassesLastFrame = 0;
      return;
    }

    const safeDeltaTime = Math.min(
      Math.max(Number.isFinite(deltaTime) ? deltaTime : 0, 0),
      1 / 30,
    );
    if (this.pointerNeedsRaycast) {
      this._updatePointerRaycast();
    } else if (this.smoothedPointerVelocity.lengthSq() > 0) {
      const pointerVelocityDecay = Math.exp(
        -Math.max(0, this.pointerConfig.inactiveVelocityDecay) *
          safeDeltaTime,
      );
      this.pointerVelocity.multiplyScalar(pointerVelocityDecay);
      this.smoothedPointerVelocity.multiplyScalar(
        pointerVelocityDecay,
      );
      const deadZone = Math.max(
        0,
        this.localizedActivityConfig.pointerVelocityDeadZone,
      );
      if (
        this.smoothedPointerVelocity.lengthSq() <
        deadZone * deadZone
      ) {
        this.pointerVelocity.set(0, 0, 0);
        this.smoothedPointerVelocity.set(0, 0, 0);
      }
    }
    this.syncPointerUniforms();
    this.syncVisualUniforms(safeDeltaTime);
    if (!this.simulationRunning) return;
    if (this.autoActivate && this.simulationProgress < 1) {
      this.setSimulationProgress(
        this.simulationProgress +
          safeDeltaTime / this.simulationConfig.activationDuration,
      );
    }
    this.sdfInfluence = THREE.MathUtils.damp(
      this.sdfInfluence,
      this.sdfInfluenceTarget,
      this.sdfInfluenceDamping,
      safeDeltaTime,
    );
    this.velocitySimulationMaterial.uniforms.uSdfEnabled.value =
      this.sdfInfluence;
    if (safeDeltaTime === 0 || this.simulationProgress === 0) return;

    const particleCollisionsActive =
      this.particleCollisionInfluence > 0 &&
      Boolean(this.particleCollisionPositionMaterial);
    const substepCount = particleCollisionsActive
      ? this.particleCollisionSubsteps
      : THREE.MathUtils.clamp(
          Math.floor(this.collisionConfig.substeps),
          1,
          4,
        );
    const rebuildParticleVoxels =
      particleCollisionsActive &&
      (
        !this._particleVoxelDataValid ||
        this._particleCollisionFrame %
          this.particleCollisionRebuildEveryNFrames ===
          0
      );
    const substepDelta = safeDeltaTime / substepCount;
    this.withPreservedRendererState(() => {
      for (let substep = 0; substep < substepCount; substep += 1) {
        this.runSimulationStep(
          substepDelta,
          elapsedTime,
          particleCollisionsActive,
          rebuildParticleVoxels,
        );
      }
    });
    if (particleCollisionsActive) this._particleCollisionFrame += 1;
    const scalePointerActive =
      this.pointerActive &&
      this.pointerInteractionEnabled &&
      this.effectVisible;
    this._scaleSettleElapsed = scalePointerActive
      ? 0
      : this._scaleSettleElapsed + safeDeltaTime;
    if (scalePointerActive || this._scaleSettleElapsed <= 1) {
      this.withPreservedRendererState(() => {
        this.updateParticleScaleState(safeDeltaTime);
      });
    }
    this.syncRenderTextures(elapsedTime);
    this._simulationPassesLastFrame =
      this._simulationPassesCurrentFrame;
  }

  getPerformanceReport() {
    const renderTargets = [
      this.positionTargetA,
      this.positionTargetB,
      this.velocityTargetA,
      this.velocityTargetB,
      this.predictedPositionTarget,
      this.predictedVelocityTarget,
      this.particleScaleTargetA,
      this.particleScaleTargetB,
      this.particleVoxelKeyTarget,
      this.voxelSortTargetA,
      this.voxelSortTargetB,
      this.voxelStartTarget,
      this.voxelEndTarget,
      this._particleCollisionPositionStorage,
      this._particleCollisionVelocityStorage,
    ]
      .filter(Boolean)
      .map((target) => ({
        name: target.texture.name || "unnamed",
        width: target.width,
        height: target.height,
        format:
          target.texture.format === THREE.RGBAFormat ? "RGBA" : "other",
        type:
          target.texture.type === THREE.FloatType
            ? "Float32"
            : target.texture.type === THREE.HalfFloatType
              ? "Float16"
              : "other",
      }));
    let raycastTargetTriangles = 0;
    this.pointerRaycastMeshes.forEach((mesh) => {
      const geometry = mesh.geometry;
      if (!geometry) return;
      raycastTargetTriangles += geometry.index
        ? geometry.index.count / 3
        : (geometry.getAttribute("position")?.count || 0) / 3;
    });
    const renderTargetBytes = renderTargets.reduce(
      (total, target) =>
        total +
        target.width *
          target.height *
          4 *
          (target.type === "Float32" ? 4 : 2),
      0,
    );
    return {
      particleCount: INSTANCE_COUNT,
      simulationPassesLastFrame: this._simulationPassesLastFrame,
      particleCollisionsEnabled:
        this.particleCollisionInfluence > 0 &&
        Boolean(this.particleCollisionPositionMaterial),
      renderTargets,
      approximateTextureMemoryBytes:
        renderTargetBytes +
        (this.sdfData?.byteLength || 0) +
        (this.collisionData?.byteLength || 0),
      raycastTargetTriangles: Math.round(raycastTargetTriangles),
      particleMaterial: this.material?.type || null,
      innerHumanMaterial: this.innerGlassMaterial?.type || null,
    };
  }

  updateParticleScaleState(deltaTime) {
    if (
      !this.particleScaleConfig.enabled ||
      !this.particleScaleMaterial ||
      !this.currentParticleScaleTarget ||
      deltaTime <= 0
    ) {
      return;
    }
    const uniforms = this.particleScaleMaterial.uniforms;
    uniforms.uPreviousScaleTexture.value =
      this.currentParticleScaleTarget.texture;
    uniforms.uPositionTexture.value =
      this.currentPositionTarget.texture;
    uniforms.uPointerActive.value =
      this.pointerActive &&
      this.pointerInteractionEnabled &&
      this.effectVisible
        ? 1
        : 0;
    uniforms.uDeltaTime.value = deltaTime;
    this.renderSimulationPass(
      this.particleScaleMaterial,
      this.nextParticleScaleTarget,
    );
    const previousScaleTarget = this.currentParticleScaleTarget;
    this.currentParticleScaleTarget = this.nextParticleScaleTarget;
    this.nextParticleScaleTarget = previousScaleTarget;
  }

  runSimulationStep(
    deltaTime,
    elapsedTime,
    particleCollisionsActive = false,
    rebuildParticleVoxels = false,
  ) {
    const velocityUniforms = this.velocitySimulationMaterial.uniforms;
    velocityUniforms.uPositionTexture.value =
      this.currentPositionTarget.texture;
    velocityUniforms.uVelocityTexture.value =
      this.currentVelocityTarget.texture;
    velocityUniforms.uBasePositionTexture.value =
      this.basePositionTexture;
    velocityUniforms.uTime.value = elapsedTime;
    velocityUniforms.uDeltaTime.value = deltaTime;
    velocityUniforms.uActivation.value = this.simulationProgress;
    const positionUniforms = this.positionSimulationMaterial.uniforms;
    positionUniforms.uPositionTexture.value =
      this.currentPositionTarget.texture;
    positionUniforms.uVelocityTexture.value =
      this.predictedVelocityTarget.texture;
    positionUniforms.uDeltaTime.value = deltaTime;
    positionUniforms.uActivation.value = this.simulationProgress;
    const collisionPositionUniforms =
      this.collisionPositionMaterial.uniforms;
    collisionPositionUniforms.uPredictedPositionTexture.value =
      this.predictedPositionTarget.texture;
    collisionPositionUniforms.uCurrentPositionTexture.value =
      this.currentPositionTarget.texture;
    collisionPositionUniforms.uCollisionEnabled.value =
      this.collisionInfluence;
    const collisionVelocityUniforms =
      this.collisionVelocityMaterial.uniforms;
    collisionVelocityUniforms.uPredictedVelocityTexture.value =
      this.predictedVelocityTarget.texture;
    collisionVelocityUniforms.uPredictedPositionTexture.value =
      this.predictedPositionTarget.texture;
    collisionVelocityUniforms.uCorrectedPositionTexture.value =
      this.nextPositionTarget.texture;
    collisionVelocityUniforms.uCollisionEnabled.value =
      this.collisionInfluence;
    collisionVelocityUniforms.uDeltaTime.value = deltaTime;
    this.renderSimulationPass(
      this.velocitySimulationMaterial,
      this.predictedVelocityTarget,
    );
    this.renderSimulationPass(
      this.positionSimulationMaterial,
      this.predictedPositionTarget,
    );
    this.renderSimulationPass(
      this.collisionPositionMaterial,
      this.nextPositionTarget,
    );
    if (particleCollisionsActive) {
      if (rebuildParticleVoxels || !this._particleVoxelDataValid) {
        this.rebuildParticleVoxelStructure(
          this.nextPositionTarget.texture,
        );
      }
      const particlePositionUniforms =
        this.particleCollisionPositionMaterial.uniforms;
      particlePositionUniforms.uExternalCorrectedPositionTexture.value =
        this.nextPositionTarget.texture;
      this.syncParticleCollisionLookupUniforms(
        this.particleCollisionPositionMaterial,
      );
      this.renderSimulationPass(
        this.particleCollisionPositionMaterial,
        this.particleCollisionPositionTarget,
      );
    }
    this.renderSimulationPass(
      this.collisionVelocityMaterial,
      this.nextVelocityTarget,
    );
    if (particleCollisionsActive) {
      const particleVelocityUniforms =
        this.particleCollisionVelocityMaterial.uniforms;
      particleVelocityUniforms.uExternalCorrectedVelocityTexture.value =
        this.nextVelocityTarget.texture;
      particleVelocityUniforms.uExternalCorrectedPositionTexture.value =
        this.nextPositionTarget.texture;
      particleVelocityUniforms.uParticleCorrectedPositionTexture.value =
        this.particleCollisionPositionTarget.texture;
      particleVelocityUniforms.uDeltaTime.value = deltaTime;
      this.syncParticleCollisionLookupUniforms(
        this.particleCollisionVelocityMaterial,
      );
      this.renderSimulationPass(
        this.particleCollisionVelocityMaterial,
        this.particleCollisionVelocityTarget,
      );

      const previousVelocityTarget = this.currentVelocityTarget;
      this.currentVelocityTarget =
        this.particleCollisionVelocityTarget;
      this.particleCollisionVelocityTarget =
        this.nextVelocityTarget;
      this.nextVelocityTarget = previousVelocityTarget;
      const previousPositionTarget = this.currentPositionTarget;
      this.currentPositionTarget =
        this.particleCollisionPositionTarget;
      this.particleCollisionPositionTarget =
        this.nextPositionTarget;
      this.nextPositionTarget = previousPositionTarget;
      return;
    }
    const previousVelocityTarget = this.currentVelocityTarget;
    this.currentVelocityTarget = this.nextVelocityTarget;
    this.nextVelocityTarget = previousVelocityTarget;
    const previousPositionTarget = this.currentPositionTarget;
    this.currentPositionTarget = this.nextPositionTarget;
    this.nextPositionTarget = previousPositionTarget;
  }

  syncRenderTextures(elapsedTime = 0) {
    const positionTexture = this.getRenderPositionTexture();
    const velocityTexture =
      this.currentVelocityTarget?.texture ||
      this.initialVelocityTexture;
    this.syncShaderTextures(
      this._shader,
      positionTexture,
      velocityTexture,
      elapsedTime,
    );
    this.syncShaderTextures(
      this._depthShader,
      positionTexture,
      velocityTexture,
      elapsedTime,
    );
    this.syncShaderTextures(
      this._distanceShader,
      positionTexture,
      velocityTexture,
      elapsedTime,
    );
  }

  syncShaderTextures(
    shader,
    positionTexture,
    velocityTexture,
    elapsedTime,
  ) {
    if (!shader) return;
    shader.uniforms.uPositionTexture.value = positionTexture;
    shader.uniforms.uVelocityTexture.value = velocityTexture;
    shader.uniforms.uParticleScaleTexture.value =
      this.currentParticleScaleTarget?.texture ||
      this.initialParticleScaleTexture;
  }

  setSimulationProgress(progress) {
    this.simulationProgress = THREE.MathUtils.clamp(progress, 0, 1);
    if (this.velocitySimulationMaterial) {
      this.velocitySimulationMaterial.uniforms.uActivation.value =
        this.simulationProgress;
    }
    if (this.positionSimulationMaterial) {
      this.positionSimulationMaterial.uniforms.uActivation.value =
        this.simulationProgress;
    }
  }

  setSdfInfluence(value) {
    this.sdfInfluence = THREE.MathUtils.clamp(value, 0, 1);
    this.sdfInfluenceTarget = this.sdfInfluence;
    if (this.velocitySimulationMaterial) {
      this.velocitySimulationMaterial.uniforms.uSdfEnabled.value =
        this.sdfInfluence;
    }
  }

  setOrientationInfluence(value) {
    this.orientationInfluence = THREE.MathUtils.clamp(value, 0, 1);
    [this._shader, this._depthShader, this._distanceShader].forEach(
      (shader) => {
        if (shader) {
          shader.uniforms.uOrientationInfluence.value =
            this.orientationInfluence;
        }
      },
    );
  }

  setCollisionInfluence(value) {
    this.collisionInfluence = THREE.MathUtils.clamp(value, 0, 1);
    if (this.collisionPositionMaterial) {
      this.collisionPositionMaterial.uniforms.uCollisionEnabled.value =
        this.collisionInfluence;
    }
    if (this.collisionVelocityMaterial) {
      this.collisionVelocityMaterial.uniforms.uCollisionEnabled.value =
        this.collisionInfluence;
    }
  }

  setPointerInteractionEnabled(enabled) {
    this.pointerInteractionEnabled = Boolean(enabled);
    if (!this.pointerInteractionEnabled) {
      this.clearPointerInteraction();
    }
  }

  enablePointerInteraction() {
    this.setPointerInteractionEnabled(true);
  }

  disablePointerInteraction() {
    this.setPointerInteractionEnabled(false);
  }

  setPointerRadius(value) {
    this.pointerConfig.radius = Math.max(
      0,
      Number.isFinite(value) ? value : 0,
    );
    if (this.velocitySimulationMaterial) {
      this.velocitySimulationMaterial.uniforms.uPointerRadius.value =
        this.pointerConfig.radius;
    }
  }

  setPointerForce(value) {
    this.pointerConfig.force = Number.isFinite(value) ? value : 0;
    if (this.velocitySimulationMaterial) {
      this.velocitySimulationMaterial.uniforms.uPointerForce.value =
        this.pointerConfig.force;
    }
  }

  setPointerDragForce(value) {
    this.pointerConfig.dragForce = Number.isFinite(value) ? value : 0;
    if (this.velocitySimulationMaterial) {
      this.velocitySimulationMaterial.uniforms.uPointerDragForce.value =
        this.pointerConfig.dragForce;
    }
  }

  setLocalizedActivityEnabled(enabled) {
    this.localizedActivityConfig.enabled = Boolean(enabled);
    this._syncLocalizedActivityUniforms();
  }

  setLocalizedActivityRadius(value) {
    this.localizedActivityConfig.radius = Math.max(
      0,
      Number.isFinite(value) ? value : 0,
    );
    this._syncLocalizedActivityUniforms();
  }

  setPointerActivityRadius(value) {
    this.setLocalizedActivityRadius(value);
  }

  setLocalizedActivityInnerRadius(value) {
    this.localizedActivityConfig.innerRadius = Math.max(
      0,
      Number.isFinite(value) ? value : 0,
    );
    this._syncLocalizedActivityUniforms();
  }

  setPointerActivityInnerRadius(value) {
    this.setLocalizedActivityInnerRadius(value);
  }

  setLocalizedActivityPower(value) {
    this.localizedActivityConfig.power = Math.max(
      0.00001,
      Number.isFinite(value) ? value : 1,
    );
    this._syncLocalizedActivityUniforms();
  }

  setInfinityFlowEnabled(enabled) {
    this.infinityFlowConfig.enabled = Boolean(enabled);
    if (this.velocitySimulationMaterial) {
      this.velocitySimulationMaterial.uniforms.uInfinityActive.value =
        this.infinityFlowConfig.enabled ? 1 : 0;
    }
  }

  setInfinityRadius(value) {
    this.infinityFlowConfig.radius = Math.max(0.0001, value);
    this._setInfinityUniform(
      "uInfinityRadius",
      this.infinityFlowConfig.radius,
    );
  }

  setInfinityStrength(value) {
    this.infinityFlowConfig.strength = Math.max(0, value);
    this._setInfinityUniform(
      "uInfinityStrength",
      this.infinityFlowConfig.strength,
    );
  }

  setInfinityRadialStrength(value) {
    this.infinityFlowConfig.radialStrength = Math.max(0, value);
    this._setInfinityUniform(
      "uInfinityRadialStrength",
      this.infinityFlowConfig.radialStrength,
    );
  }

  setInfinityVerticalScale(value) {
    this.infinityFlowConfig.verticalScale = Math.max(0.0001, value);
    this._setInfinityUniform(
      "uInfinityVerticalScale",
      this.infinityFlowConfig.verticalScale,
    );
  }

  setInfinityNoiseStrength(value) {
    this.infinityFlowConfig.noiseStrength = Math.max(0, value);
    this._setInfinityUniform(
      "uInfinityNoiseStrength",
      this.infinityFlowConfig.noiseStrength,
    );
  }

  setInfinityOrientationMode(mode) {
    if (
      ![
        "pointer-motion",
        "surface-stable",
        "camera-aligned",
      ].includes(mode)
    ) {
      throw new Error(
        `[BlockSurfaceHuman] Invalid infinity orientation mode: ${mode}.`,
      );
    }
    this.infinityFlowConfig.orientationMode = mode;
  }

  _setInfinityUniform(name, value) {
    if (this.velocitySimulationMaterial?.uniforms[name]) {
      this.velocitySimulationMaterial.uniforms[name].value = value;
    }
  }

  setParticleMinScale(value) {
    this.particleScaleConfig.minScale = Math.max(0.001, value);
    this._updateParticleScaleRenderUniform(
      "uParticleMinScale",
      this.particleScaleConfig.minScale,
    );
  }

  setParticleMaxScale(value) {
    this.particleScaleConfig.maxScale = Math.max(0.001, value);
    this._updateParticleScaleRenderUniform(
      "uParticleMaxScale",
      this.particleScaleConfig.maxScale,
    );
  }

  setParticleScaleAttack(value) {
    this.particleScaleConfig.attack = Math.max(0, value);
    if (this.particleScaleMaterial) {
      this.particleScaleMaterial.uniforms.uScaleAttack.value =
        this.particleScaleConfig.attack;
    }
  }

  setParticleScaleRelease(value) {
    this.particleScaleConfig.release = Math.max(0, value);
    if (this.particleScaleMaterial) {
      this.particleScaleMaterial.uniforms.uScaleRelease.value =
        this.particleScaleConfig.release;
    }
  }

  setParticleScaleInteractionEnabled(enabled) {
    this.particleScaleConfig.enabled = Boolean(enabled);
    this._updateParticleScaleRenderUniform(
      "uParticleScaleEnabled",
      this.particleScaleConfig.enabled ? 1 : 0,
    );
  }

  _updateParticleScaleRenderUniform(name, value) {
    [this._shader, this._depthShader, this._distanceShader].forEach(
      (shader) => {
        if (shader?.uniforms[name]) shader.uniforms[name].value = value;
      },
    );
  }

  setInactiveDamping(value) {
    this.localizedActivityConfig.inactiveDamping = Math.max(0, value);
    this._syncLocalizedActivityUniforms();
  }

  setActiveDamping(value) {
    this.localizedActivityConfig.activeDamping = Math.max(0, value);
    this._syncLocalizedActivityUniforms();
  }

  setInactiveSdfRecovery(value) {
    this.localizedActivityConfig.inactiveSdfRecovery = Math.max(
      0.00001,
      value,
    );
    this._syncLocalizedActivityUniforms();
  }

  _syncLocalizedActivityUniforms() {
    const config = this.localizedActivityConfig;
    const simulationUniforms =
      this.velocitySimulationMaterial?.uniforms;
    if (simulationUniforms) {
      simulationUniforms.uLocalizedActivityEnabled.value =
        config.enabled ? 1 : 0;
      simulationUniforms.uPointerActivityRadius.value = config.radius;
      simulationUniforms.uPointerActivityInnerRadius.value =
        config.innerRadius;
      simulationUniforms.uPointerActivityPower.value = config.power;
      simulationUniforms.uActiveCurlStrength.value =
        config.activeCurlStrength;
      simulationUniforms.uActiveDamping.value =
        config.activeDamping;
      simulationUniforms.uInactiveDamping.value =
        config.inactiveDamping;
      simulationUniforms.uInactiveTangentialDamping.value =
        config.inactiveTangentialDamping;
    }
    if (this.particleScaleMaterial) {
      const scaleUniforms = this.particleScaleMaterial.uniforms;
      scaleUniforms.uPointerActivityRadius.value = config.radius;
      scaleUniforms.uPointerActivityInnerRadius.value =
        config.innerRadius;
      scaleUniforms.uPointerActivityPower.value = config.power;
    }
    [this._shader, this._depthShader, this._distanceShader].forEach(
      (shader) => {
        if (!shader) return;
        shader.uniforms.uLocalizedActivityEnabled.value =
          config.enabled ? 1 : 0;
        shader.uniforms.uPointerActivityRadius.value = config.radius;
        shader.uniforms.uPointerActivityInnerRadius.value =
          config.innerRadius;
        shader.uniforms.uPointerActivityPower.value = config.power;
      },
    );
    this.updateAimMaterialUniform(
      "uHoverBrightness",
      config.activityBrightness,
    );
  }

  setParticleCollisionInfluence(value) {
    const nextInfluence =
      this.particleCollisionPositionMaterial
        ? THREE.MathUtils.clamp(value, 0, 1)
        : 0;
    const wasDisabled = this.particleCollisionInfluence === 0;
    this.particleCollisionInfluence = nextInfluence;
    [
      this.particleCollisionPositionMaterial,
      this.particleCollisionVelocityMaterial,
    ].forEach((material) => {
      if (material) {
        material.uniforms.uParticleCollisionEnabled.value =
          nextInfluence;
      }
    });
    if (wasDisabled && nextInfluence > 0) {
      this._particleVoxelDataValid = false;
      this._particleCollisionFrame = 0;
    }
  }

  setParticleCollisionsEnabled(enabled) {
    this.setParticleCollisionInfluence(enabled ? 1 : 0);
  }

  enableCollision() {
    this.setCollisionInfluence(1);
  }

  disableCollision() {
    this.setCollisionInfluence(0);
  }

  setSdfInfluenceTarget(value, duration = null) {
    this.sdfInfluenceTarget = THREE.MathUtils.clamp(value, 0, 1);
    this.sdfInfluenceDamping =
      Number.isFinite(duration) && duration > 0
        ? -Math.log(0.01) / duration
        : this.sdfConfig.influenceDamping;
  }

  enableSdf(duration = null) {
    this.setSdfInfluenceTarget(1, duration);
  }

  disableSdf(duration = null) {
    this.setSdfInfluenceTarget(0, duration);
  }

  startSimulation({ autoActivate = false } = {}) {
    if (!this.simulationInitialized || this.disposed) return;
    this.clearPointerInteraction();
    this.simulationRunning = true;
    this.autoActivate = autoActivate;
  }

  pauseSimulation() {
    this.simulationRunning = false;
  }

  resetSimulation() {
    if (!this.simulationInitialized || this.disposed) return;
    this.withPreservedRendererState(() => {
      this.copyTextureToTarget(
        this.basePositionTexture,
        this.positionTargetA,
      );
      this.copyTextureToTarget(
        this.basePositionTexture,
        this.positionTargetB,
      );
      this.copyTextureToTarget(
        this.initialVelocityTexture,
        this.velocityTargetA,
      );
      this.copyTextureToTarget(
        this.initialVelocityTexture,
        this.velocityTargetB,
      );
      this.copyTextureToTarget(
        this.initialParticleScaleTexture,
        this.particleScaleTargetA,
      );
      this.copyTextureToTarget(
        this.initialParticleScaleTexture,
        this.particleScaleTargetB,
      );
      if (this._particleCollisionPositionStorage) {
        this.copyTextureToTarget(
          this.basePositionTexture,
          this._particleCollisionPositionStorage,
        );
        this.copyTextureToTarget(
          this.initialVelocityTexture,
          this._particleCollisionVelocityStorage,
        );
      }
    });
    this.currentPositionTarget = this.positionTargetA;
    this.nextPositionTarget = this.positionTargetB;
    this.currentVelocityTarget = this.velocityTargetA;
    this.nextVelocityTarget = this.velocityTargetB;
    this.currentParticleScaleTarget = this.particleScaleTargetA;
    this.nextParticleScaleTarget = this.particleScaleTargetB;
    this.particleCollisionPositionTarget =
      this._particleCollisionPositionStorage;
    this.particleCollisionVelocityTarget =
      this._particleCollisionVelocityStorage;
    this.simulationRunning = false;
    this.autoActivate = false;
    this.clearPointerInteraction();
    this._particleCollisionFrame = 0;
    this._particleVoxelDataValid = false;
    this.setSimulationProgress(0);
    this.syncRenderTextures();
  }

  getSimulationState() {
    return {
      running: this.simulationRunning,
      progress: this.simulationProgress,
      sdfInfluence: this.sdfInfluence,
      sdfInfluenceTarget: this.sdfInfluenceTarget,
      orientationInfluence: this.orientationInfluence,
      collisionInfluence: this.collisionInfluence,
      pointerInteractionEnabled: this.pointerInteractionEnabled,
      pointerActive: this.pointerActive,
      pointerPosition: this.pointerLocalPosition,
      pointerVelocity: this.smoothedPointerVelocity,
      particleCollisionInfluence: this.particleCollisionInfluence,
      particleCollisionQuality:
        this.particleCollisionConfig.quality,
      particleVoxelDataValid: this._particleVoxelDataValid,
      currentPositionTexture: this.currentPositionTarget?.texture || null,
      currentVelocityTexture: this.currentVelocityTarget?.texture || null,
    };
  }

  configurePositionMaterial(material, shaderSlot) {
    material.onBeforeCompile = (shader) => {
      const collisionDebugEnabled =
        shaderSlot === "main" &&
        this.debugCollision &&
        this.collisionDebugMode !== "none";
      const pointerDebugEnabled =
        shaderSlot === "main" &&
        this.pointerDebugMode !== "none";
      shader.uniforms.uPositionTexture = {
        value: this.getRenderPositionTexture(),
      };
      shader.uniforms.uVelocityTexture = {
        value:
          this.currentVelocityTarget?.texture ||
          this.initialVelocityTexture,
      };
      shader.uniforms.uSdfTexture = { value: this.sdfTexture };
      shader.uniforms.uPositionTextureSize = {
        value: this.positionTextureSize,
      };
      shader.uniforms.uSdfBoundsMin = {
        value: new THREE.Vector3().fromArray(
          this.sdfMetadata.boundsMin,
        ),
      };
      shader.uniforms.uSdfBoundsMax = {
        value: new THREE.Vector3().fromArray(
          this.sdfMetadata.boundsMax,
        ),
      };
      shader.uniforms.uSdfVoxelSize = {
        value: new THREE.Vector3().fromArray(
          this.sdfMetadata.voxelSize,
        ),
      };
      shader.uniforms.uBlockDimensions = {
        value: new THREE.Vector3(
          this.orientationConfig.blockLength,
          this.orientationConfig.blockWidth,
          this.orientationConfig.blockHeight,
        ),
      };
      shader.uniforms.uOrientationInfluence = {
        value: this.orientationInfluence,
      };
      shader.uniforms.uVelocityThreshold = {
        value: this.orientationConfig.velocityThreshold,
      };
      shader.uniforms.uNormalBlend = {
        value: this.orientationConfig.normalBlend,
      };
      shader.uniforms.uSdfGradientStep = {
        value: this.orientationConfig.sdfGradientStep,
      };
      shader.uniforms.uLengthVariation = {
        value: this.orientationConfig.lengthVariation,
      };
      shader.uniforms.uSpeedStretch = {
        value: this.orientationConfig.speedStretch,
      };
      shader.uniforms.uMaximumStretch = {
        value: this.orientationConfig.maximumStretch,
      };
      shader.uniforms.uSurfacePivot = {
        value:
          this.orientationConfig.surfacePivot === "innerFace" ? 1 : 0,
      };
      shader.uniforms.uAimPointerPosition = {
        value: this.pointerLocalPosition,
      };
      shader.uniforms.uAimPointerRadius = {
        value: this.pointerConfig.radius,
      };
      shader.uniforms.uPointerVisualActivity = {
        value: this.pointerVisualActivity,
      };
      shader.uniforms.uInfinityPointerNormal = {
        value: this.pointerLocalNormal,
      };
      shader.uniforms.uInfinityPointerTangent = {
        value: this.pointerLocalTangent,
      };
      shader.uniforms.uInfinityPointerBitangent = {
        value: this.pointerLocalBitangent,
      };
      shader.uniforms.uInfinityRadius = {
        value: this.infinityFlowConfig.radius,
      };
      shader.uniforms.uInfinityVerticalScale = {
        value: this.infinityFlowConfig.verticalScale,
      };
      shader.uniforms.uParticleScaleTexture = {
        value: this.currentParticleScaleTarget?.texture,
      };
      shader.uniforms.uParticleMinScale = {
        value: this.particleScaleConfig.minScale,
      };
      shader.uniforms.uParticleMaxScale = {
        value: this.particleScaleConfig.maxScale,
      };
      shader.uniforms.uParticleScaleVariationMin = {
        value: this.particleScaleConfig.variationMin,
      };
      shader.uniforms.uParticleScaleVariationMax = {
        value: this.particleScaleConfig.variationMax,
      };
      shader.uniforms.uParticleScaleEnabled = {
        value: this.particleScaleConfig.enabled ? 1 : 0,
      };
      shader.uniforms.uUsePersistentParticleScale = {
        value:
          this.particleScaleConfig.usePersistentScaleTexture !== false
            ? 1
            : 0,
      };
      shader.uniforms.uLocalizedActivityEnabled = {
        value: this.localizedActivityConfig.enabled ? 1 : 0,
      };
      shader.uniforms.uPointerActivityRadius = {
        value: this.localizedActivityConfig.radius,
      };
      shader.uniforms.uPointerActivityInnerRadius = {
        value: this.localizedActivityConfig.innerRadius,
      };
      shader.uniforms.uPointerActivityPower = {
        value: this.localizedActivityConfig.power,
      };
      if (pointerDebugEnabled) {
        shader.uniforms.uDebugPointerPosition = {
          value:
            this.velocitySimulationMaterial.uniforms.uPointerPosition
              .value,
        };
        shader.uniforms.uDebugPointerVelocity = {
          value:
            this.velocitySimulationMaterial.uniforms.uPointerVelocity
              .value,
        };
        shader.uniforms.uDebugPointerRadius = {
          value:
            this.velocitySimulationMaterial.uniforms.uPointerRadius
              .value,
        };
        shader.uniforms.uDebugPointerActive = {
          value:
            this.velocitySimulationMaterial.uniforms.uPointerActive
              .value,
        };
      }
      if (collisionDebugEnabled) {
        shader.uniforms.uCollisionTexture = {
          value: this.collisionTexture,
        };
        shader.uniforms.uCollisionBoundsMin = {
          value: new THREE.Vector3().fromArray(
            this.collisionMetadata.boundsMin,
          ),
        };
        shader.uniforms.uCollisionBoundsMax = {
          value: new THREE.Vector3().fromArray(
            this.collisionMetadata.boundsMax,
          ),
        };
        shader.uniforms.uCollisionVoxelSize = {
          value: new THREE.Vector3().fromArray(
            this.collisionMetadata.voxelSize,
          ),
        };
        shader.uniforms.uCollisionRequiredDistance = {
          value:
            this.collisionConfig.radius + this.collisionConfig.skin,
        };
      }
      const collisionDebugVertex = collisionDebugEnabled
        ? `
uniform sampler3D uCollisionTexture;
uniform vec3 uCollisionBoundsMin;
uniform vec3 uCollisionBoundsMax;
uniform vec3 uCollisionVoxelSize;
uniform float uCollisionRequiredDistance;
varying float vCollisionDistance;
varying vec3 vCollisionNormal;

float sampleDebugCollision(vec3 worldPosition) {
  vec3 uv =
    (worldPosition - uCollisionBoundsMin) /
    (uCollisionBoundsMax - uCollisionBoundsMin);
  bool insideVolume =
    all(greaterThanEqual(uv, vec3(0.0))) &&
    all(lessThanEqual(uv, vec3(1.0)));
  return insideVolume
    ? texture(uCollisionTexture, uv).r
    : 1000000.0;
}

vec3 calculateDebugCollisionNormal(vec3 worldPosition) {
  vec3 stepSize = uCollisionVoxelSize;
  vec3 gradient = vec3(
    sampleDebugCollision(worldPosition + vec3(stepSize.x, 0.0, 0.0)) -
      sampleDebugCollision(worldPosition - vec3(stepSize.x, 0.0, 0.0)),
    sampleDebugCollision(worldPosition + vec3(0.0, stepSize.y, 0.0)) -
      sampleDebugCollision(worldPosition - vec3(0.0, stepSize.y, 0.0)),
    sampleDebugCollision(worldPosition + vec3(0.0, 0.0, stepSize.z)) -
      sampleDebugCollision(worldPosition - vec3(0.0, 0.0, stepSize.z))
  );
  float gradientLength = length(gradient);
  return gradientLength > 0.00001
    ? gradient / gradientLength
    : vec3(0.0, 1.0, 0.0);
}
`
        : "";
      const pointerDebugVertex = pointerDebugEnabled
        ? `
uniform vec3 uDebugPointerPosition;
uniform vec3 uDebugPointerVelocity;
uniform float uDebugPointerRadius;
uniform float uDebugPointerActive;
varying float vPointerInfluence;
varying vec3 vPointerRepulsion;
varying vec3 vPointerDrag;
`
        : "";
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform sampler3D uSdfTexture;
uniform float uPositionTextureSize;
uniform vec3 uSdfBoundsMin;
uniform vec3 uSdfBoundsMax;
uniform vec3 uSdfVoxelSize;
uniform vec3 uBlockDimensions;
uniform float uOrientationInfluence;
uniform float uVelocityThreshold;
uniform float uNormalBlend;
uniform float uSdfGradientStep;
uniform float uLengthVariation;
uniform float uSpeedStretch;
uniform float uMaximumStretch;
uniform float uSurfacePivot;
uniform vec3 uAimPointerPosition;
uniform float uAimPointerRadius;
uniform float uPointerVisualActivity;
uniform vec3 uInfinityPointerNormal;
uniform vec3 uInfinityPointerTangent;
uniform vec3 uInfinityPointerBitangent;
uniform float uInfinityRadius;
uniform float uInfinityVerticalScale;
uniform sampler2D uParticleScaleTexture;
uniform float uParticleMinScale;
uniform float uParticleMaxScale;
uniform float uParticleScaleVariationMin;
uniform float uParticleScaleVariationMax;
uniform float uParticleScaleEnabled;
uniform float uUsePersistentParticleScale;
uniform float uLocalizedActivityEnabled;
uniform float uPointerActivityRadius;
uniform float uPointerActivityInnerRadius;
uniform float uPointerActivityPower;
varying vec3 vBlockTangent;
varying vec3 vBlockNormal;
varying vec3 vBlockBitangent;
varying float vBlockSpeed;
varying float vParticleCollisionDebug;
flat varying float vAimParticleSeed;
flat varying float vAimHoverInfluence;
flat varying float vAimParticleSpeed;
flat varying float vAimParticleIndex;
flat varying float vAimParticleValid;
flat varying float vAimSdfDistance;
flat varying float vAimBoundsDistance;
flat varying float vInfinityCurveDistance;
flat varying float vInfinityCenterMask;
flat varying vec3 vInfinityFieldDirection;
flat varying float vAimScaleActivity;
flat varying float vAimFinalScale;
${collisionDebugVertex}
${pointerDebugVertex}

ivec2 getBlockTexelCoord(const int instanceIndex) {
  int textureSize = int( uPositionTextureSize );
  return ivec2(
    instanceIndex % textureSize,
    instanceIndex / textureSize
  );
}

float sampleRenderSdf(vec3 worldPosition) {
  vec3 sdfUv =
    (worldPosition - uSdfBoundsMin) /
    (uSdfBoundsMax - uSdfBoundsMin);
  return texture(
    uSdfTexture,
    clamp(sdfUv, vec3(0.0), vec3(1.0))
  ).r;
}

bool isInsideRenderSdf(vec3 worldPosition) {
  vec3 sdfUv =
    (worldPosition - uSdfBoundsMin) /
    (uSdfBoundsMax - uSdfBoundsMin);
  return all(greaterThanEqual(sdfUv, vec3(0.0))) &&
    all(lessThanEqual(sdfUv, vec3(1.0)));
}

vec3 calculateRenderSdfNormal(vec3 worldPosition) {
  if (!isInsideRenderSdf(worldPosition)) {
    return vec3(0.0, 1.0, 0.0);
  }
  vec3 stepSize = uSdfVoxelSize * uSdfGradientStep;
  vec3 gradient = vec3(
    (
      sampleRenderSdf(worldPosition + vec3(stepSize.x, 0.0, 0.0)) -
      sampleRenderSdf(worldPosition - vec3(stepSize.x, 0.0, 0.0))
    ) / (2.0 * stepSize.x),
    (
      sampleRenderSdf(worldPosition + vec3(0.0, stepSize.y, 0.0)) -
      sampleRenderSdf(worldPosition - vec3(0.0, stepSize.y, 0.0))
    ) / (2.0 * stepSize.y),
    (
      sampleRenderSdf(worldPosition + vec3(0.0, 0.0, stepSize.z)) -
      sampleRenderSdf(worldPosition - vec3(0.0, 0.0, stepSize.z))
    ) / (2.0 * stepSize.z)
  );
  float gradientLength = length(gradient);
  return gradientLength > 0.00001
    ? gradient / gradientLength
    : vec3(0.0, 1.0, 0.0);
}

vec3 getFallbackTangent(vec3 normal, float seed) {
  vec3 referenceAxis = abs(normal.y) < 0.9
    ? vec3(0.0, 1.0, 0.0)
    : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(referenceAxis, normal));
  vec3 signReference = normalize(vec3(
    sin(seed * 17.13),
    cos(seed * 11.71),
    sin(seed * 7.91)
  ));
  return dot(tangent, signReference) < 0.0 ? -tangent : tangent;
}

void getBlockFrame(
  const int instanceIndex,
  out vec3 particlePosition,
  out vec3 particleVelocity,
  out float particleSeed,
  out mat3 orientation
) {
  ivec2 texelCoord = getBlockTexelCoord(instanceIndex);
  vec4 particlePositionSample = texelFetch(
    uPositionTexture,
    texelCoord,
    0
  );
  particlePosition = particlePositionSample.xyz;
  vParticleCollisionDebug = particlePositionSample.a;
  vec4 velocitySample = texelFetch(
    uVelocityTexture,
    texelCoord,
    0
  );
  particleVelocity = velocitySample.xyz;
  particleSeed = velocitySample.a;
  vec3 dynamicNormal =
    calculateRenderSdfNormal(particlePosition);
  vec3 fallbackNormal = vec3(0.0, 1.0, 0.0);
  vec3 normal = mix(
    fallbackNormal,
    dynamicNormal,
    uOrientationInfluence * uNormalBlend
  );
  float normalLength = length(normal);
  normal = normalLength > 0.0001
    ? normal / normalLength
    : fallbackNormal;
  vec3 fallbackTangent =
    getFallbackTangent(normal, particleSeed);
  vec3 dynamicTangent =
    particleVelocity -
    normal * dot(particleVelocity, normal);
  dynamicTangent -=
    normal * dot(dynamicTangent, normal);
  float tangentLength = length(dynamicTangent);
  dynamicTangent = tangentLength > uVelocityThreshold
    ? dynamicTangent / tangentLength
    : fallbackTangent;
  vec3 tangent = mix(
    fallbackTangent,
    dynamicTangent,
    uOrientationInfluence
  );
  tangent -= normal * dot(tangent, normal);
  float finalTangentLength = length(tangent);
  tangent = finalTangentLength > 0.0001
    ? tangent / finalTangentLength
    : fallbackTangent;
  vec3 bitangent = normalize(cross(normal, tangent));
  tangent = normalize(cross(bitangent, normal));
  if (dot(cross(tangent, bitangent), normal) < 0.0) {
    bitangent *= -1.0;
    tangent = normalize(cross(bitangent, normal));
  }
  orientation = mat3(tangent, bitangent, normal);
}`,
      );
      let beginVertexShader = BEGIN_VERTEX_ORIENTATION;
      if (collisionDebugEnabled) {
        beginVertexShader += `
vCollisionDistance =
  sampleDebugCollision(blockParticlePosition);
vCollisionNormal =
  calculateDebugCollisionNormal(blockParticlePosition);
`;
      }
      if (pointerDebugEnabled) {
        beginVertexShader += `
vec3 debugPointerDelta =
  blockParticlePosition - uDebugPointerPosition;
float debugPointerDistance = length(debugPointerDelta);
vPointerInfluence = uDebugPointerRadius > 0.00001
  ? (1.0 - smoothstep(
      0.0,
      uDebugPointerRadius,
      debugPointerDistance
    )) * uDebugPointerActive
  : 0.0;
vPointerRepulsion = debugPointerDistance > 0.00001
  ? debugPointerDelta / debugPointerDistance
  : vBlockNormal;
vPointerDrag =
  uDebugPointerVelocity -
  vBlockNormal * dot(uDebugPointerVelocity, vBlockNormal);
`;
      }
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        BEGINNORMAL_VERTEX_ORIENTATION,
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        beginVertexShader,
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        PROJECT_VERTEX_TEXTURE,
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        WORLDPOS_VERTEX_TEXTURE,
      );
      if (shaderSlot === "main") {
        shader.uniforms.uAimBaseColor = {
          value: new THREE.Color(this.visualConfig.baseColor),
        };
        shader.uniforms.uAimSecondaryColor = {
          value: new THREE.Color(this.visualConfig.secondaryColor),
        };
        shader.uniforms.uBrightnessVariation = {
          value: this.visualConfig.brightnessVariation,
        };
        shader.uniforms.uRoughnessVariation = {
          value: this.visualConfig.roughnessVariation,
        };
        shader.uniforms.uAimBaseRoughness = {
          value: this.visualConfig.roughness,
        };
        shader.uniforms.uHoverBrightness = {
          value: this.localizedActivityConfig.activityBrightness,
        };
        shader.uniforms.uHoverRoughnessReduction = {
          value: this.visualConfig.hoverRoughnessReduction,
        };
        shader.uniforms.uHoverColor = {
          value: new THREE.Color(this.visualConfig.hoverColor),
        };
        shader.uniforms.uHoverEmissiveStrength = {
          value: this.visualConfig.hoverEmissiveStrength,
        };
        shader.uniforms.uFresnelColor = {
          value: new THREE.Color(this.visualConfig.fresnelColor),
        };
        shader.uniforms.uFresnelStrength = {
          value: this.visualConfig.fresnelStrength,
        };
        shader.uniforms.uFresnelPower = {
          value: this.visualConfig.fresnelPower,
        };
        shader.uniforms.uSpeedBrightness = {
          value: this.visualConfig.speedBrightness,
        };
        shader.uniforms.uSpeedHighlightMin = {
          value: this.visualConfig.speedHighlightMin,
        };
        shader.uniforms.uSpeedHighlightMax = {
          value: this.visualConfig.speedHighlightMax,
        };
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `#include <common>
uniform vec3 uAimBaseColor;
uniform vec3 uAimSecondaryColor;
uniform float uBrightnessVariation;
uniform float uRoughnessVariation;
uniform float uAimBaseRoughness;
uniform float uHoverBrightness;
uniform float uHoverRoughnessReduction;
uniform vec3 uHoverColor;
uniform float uHoverEmissiveStrength;
uniform vec3 uFresnelColor;
uniform float uFresnelStrength;
uniform float uFresnelPower;
uniform float uSpeedBrightness;
uniform float uSpeedHighlightMin;
uniform float uSpeedHighlightMax;
uniform vec3 uInfinityPointerNormal;
uniform vec3 uInfinityPointerTangent;
uniform vec3 uInfinityPointerBitangent;
uniform float uParticleMaxScale;
flat varying float vAimParticleSeed;
flat varying float vAimHoverInfluence;
flat varying float vAimParticleSpeed;
flat varying float vAimParticleIndex;
flat varying float vAimParticleValid;
flat varying float vAimSdfDistance;
flat varying float vAimBoundsDistance;
flat varying float vInfinityCurveDistance;
flat varying float vInfinityCenterMask;
flat varying vec3 vInfinityFieldDirection;
flat varying float vAimScaleActivity;
flat varying float vAimFinalScale;`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
float aimBrightnessVariation = mix(
  1.0 - uBrightnessVariation,
  1.0 + uBrightnessVariation,
  vAimParticleSeed
);
float aimSpeedFactor = smoothstep(
  uSpeedHighlightMin,
  uSpeedHighlightMax,
  vAimParticleSpeed
);
vec3 aimInstanceColor = mix(
  uAimBaseColor,
  uAimSecondaryColor,
  vAimParticleSeed * 0.32
);
aimInstanceColor *=
  aimBrightnessVariation *
  (1.0 + aimSpeedFactor * uSpeedBrightness * vAimScaleActivity) *
  (1.0 + vAimScaleActivity * uHoverBrightness);
diffuseColor.rgb = aimInstanceColor;`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
float aimRoughnessSeed =
  fract(vAimParticleSeed * 17.371);
roughnessFactor = clamp(
  uAimBaseRoughness +
  (aimRoughnessSeed - 0.5) * uRoughnessVariation -
  vAimScaleActivity * uHoverRoughnessReduction,
  0.08,
  0.75
);`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
totalEmissiveRadiance +=
  uHoverColor *
  vAimScaleActivity *
  uHoverEmissiveStrength;`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `float aimFresnel = pow(
  1.0 -
  max(
    dot(normalize(normal), normalize(vViewPosition)),
    0.0
  ),
  uFresnelPower
);
outgoingLight +=
  uFresnelColor *
  aimFresnel *
  uFresnelStrength;
#include <opaque_fragment>`,
        );
      }
      if (
        shaderSlot === "main" &&
        this.debugOrientation &&
        this.orientationDebugMode !== "none" &&
        !collisionDebugEnabled
      ) {
        const debugDirection = {
          normal: "vBlockNormal",
          tangent: "vBlockTangent",
          bitangent: "vBlockBitangent",
          speed: null,
        }[this.orientationDebugMode];
        if (debugDirection || this.orientationDebugMode === "speed") {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            `#include <common>
varying vec3 vBlockTangent;
varying vec3 vBlockNormal;
varying vec3 vBlockBitangent;
varying float vBlockSpeed;`,
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <opaque_fragment>",
            `#include <opaque_fragment>
gl_FragColor.rgb = ${
              this.orientationDebugMode === "speed"
                ? "vec3(clamp(vBlockSpeed * 2.0, 0.0, 1.0))"
                : `normalize(${debugDirection}) * 0.5 + 0.5`
            };`,
          );
        }
      }
      if (collisionDebugEnabled) {
        const debugColor = {
          distance:
            "vec3(clamp(vCollisionDistance * 8.0 + 0.5, 0.0, 1.0))",
          penetration:
            "mix(vec3(0.05), vec3(1.0, 0.0, 0.0), step(vCollisionDistance, uCollisionRequiredDistance))",
          normal: "normalize(vCollisionNormal) * 0.5 + 0.5",
          contact:
            "vCollisionDistance < uCollisionRequiredDistance ? vec3(0.1, 1.0, 0.25) : vec3(0.03)",
        }[this.collisionDebugMode];
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `#include <common>
uniform float uCollisionRequiredDistance;
varying float vCollisionDistance;
varying vec3 vCollisionNormal;`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = ${debugColor};`,
        );
      }
      if (
        shaderSlot === "main" &&
        this.particleCollisionDebugMode !== "none"
      ) {
        const particleDebugColor =
          this.particleCollisionDebugMode === "voxel-key"
            ? "vec3(fract(vParticleCollisionDebug * 17.0), fract(vParticleCollisionDebug * 37.0), fract(vParticleCollisionDebug * 67.0))"
            : this.particleCollisionDebugMode === "overflow"
              ? "mix(vec3(0.02), vec3(1.0, 0.0, 1.0), step(0.5, vParticleCollisionDebug))"
              : "vParticleCollisionDebug < 0.5 ? mix(vec3(0.02), vec3(1.0, 0.8, 0.0), vParticleCollisionDebug * 2.0) : mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.0, 0.0), (vParticleCollisionDebug - 0.5) * 2.0)";
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `#include <common>
varying float vParticleCollisionDebug;`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = ${particleDebugColor};`,
          );
      }
      if (
        shaderSlot === "main" &&
        this.materialDebugMode !== "none"
      ) {
        const materialDebugColor = {
          seed: "vec3(vAimParticleSeed)",
          "hover-influence": "vec3(vAimHoverInfluence)",
          roughness: "vec3(roughnessFactor)",
          fresnel: "vec3(aimFresnel)",
          speed:
            "vec3(clamp(vAimParticleSpeed * 2.0, 0.0, 1.0))",
        }[this.materialDebugMode];
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = ${materialDebugColor};`,
          );
      }
      if (
        shaderSlot === "main" &&
        this.activityDebugMode !== "none"
      ) {
        const activityDebugColor = {
          mask: "vec3(vAimHoverInfluence)",
          "active-only":
            "vAimHoverInfluence > 0.001 ? vec3(0.15, 0.85, 1.0) : vec3(0.0)",
          velocity:
            "vec3(clamp(vAimParticleSpeed / max(uSpeedHighlightMax, 0.00001), 0.0, 1.0))",
        }[this.activityDebugMode];
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = ${activityDebugColor};`,
        );
      }
      if (
        shaderSlot === "main" &&
        this.particleStateDebugMode !== "none"
      ) {
        const particleStateDebugColor = {
          index:
            "vec3(fract(vAimParticleIndex * 17.0), fract(vAimParticleIndex * 37.0), fract(vAimParticleIndex * 67.0))",
          sdf:
            "mix(vAimSdfDistance < 0.0 ? vec3(0.05, 0.2, 1.0) : vec3(1.0, 0.05, 0.02), vec3(1.0), 1.0 - smoothstep(0.0, 0.01, abs(vAimSdfDistance)))",
          bounds:
            "vAimBoundsDistance <= 0.00001 ? vec3(0.05, 0.9, 0.2) : vec3(1.0, 0.0, 1.0)",
          speed:
            "mix(vec3(0.0), vec3(1.0, 0.2, 0.02), clamp(vAimParticleSpeed / max(uSpeedHighlightMax, 0.00001), 0.0, 1.0))",
          composite:
            "vAimParticleValid < 0.5 ? vec3(1.0, 0.0, 1.0) : (vAimSdfDistance > 0.0 ? vec3(1.0, 0.05, 0.02) : mix(vec3(0.0, 0.1, 0.8), vec3(1.0, 0.8, 0.05), clamp(vAimParticleSpeed / max(uSpeedHighlightMax, 0.00001), 0.0, 1.0)))",
        }[this.particleStateDebugMode];
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = ${particleStateDebugColor};`,
        );
      }
      if (
        shaderSlot === "main" &&
        !["none", "activity"].includes(this.infinityDebugMode)
      ) {
        const infinityDebugColor = {
          basis:
            "abs(normalize(uInfinityPointerTangent)) * vec3(1.0, 0.15, 0.15) + abs(normalize(uInfinityPointerBitangent)) * vec3(0.15, 1.0, 0.15) + abs(normalize(uInfinityPointerNormal)) * vec3(0.15, 0.15, 1.0)",
          "field-direction":
            "normalize(vInfinityFieldDirection) * 0.5 + 0.5",
          "curve-distance":
            "mix(vec3(0.1, 0.2, 1.0), vec3(1.0, 0.1, 0.05), vInfinityCurveDistance * 0.5 + 0.5)",
          center: "vec3(vInfinityCenterMask)",
        }[this.infinityDebugMode];
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = ${infinityDebugColor};`,
        );
      }
      if (
        shaderSlot === "main" &&
        this.particleScaleDebugMode !== "none"
      ) {
        const particleScaleDebugColor =
          this.particleScaleDebugMode === "scale-activity"
            ? "vec3(vAimScaleActivity)"
            : "vec3(clamp(vAimFinalScale / max(uParticleMaxScale, 0.00001), 0.0, 1.0))";
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = ${particleScaleDebugColor};`,
        );
      }
      if (pointerDebugEnabled) {
        const pointerDebugColor = {
          influence: "vec3(vPointerInfluence)",
          repulsion:
            "normalize(vPointerRepulsion) * 0.5 + 0.5",
          drag:
            "length(vPointerDrag) > 0.00001 ? normalize(vPointerDrag) * 0.5 + 0.5 : vec3(0.5)",
        }[this.pointerDebugMode];
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `#include <common>
varying float vPointerInfluence;
varying vec3 vPointerRepulsion;
varying vec3 vPointerDrag;`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
gl_FragColor.rgb = ${pointerDebugColor};`,
        );
      }
      if (shaderSlot === "main") this._shader = shader;
      if (shaderSlot === "depth") this._depthShader = shader;
      if (shaderSlot === "distance") this._distanceShader = shader;
    };
    material.customProgramCacheKey = () =>
      `ParticleBodyEffect_LocalizedActivity_v2_${this.activityDebugMode}_${this.particleStateDebugMode}`;
    material.needsUpdate = true;
  }

  logPositionTextureDiagnostics() {
    debugLog("[BlockSurfaceHuman] Position texture:", {
      width: POSITION_TEXTURE_SIZE,
      height: POSITION_TEXTURE_SIZE,
      texels: INSTANCE_COUNT,
      type: "Float32 RGBA",
    });
    [0, 1024, 2048, 4095].forEach((index) => {
      const offset = index * 4;
      const storedPosition = [
        this.positionData[offset],
        this.positionData[offset + 1],
        this.positionData[offset + 2],
      ];
      debugLog(`[BlockSurfaceHuman] Position ${index}:`, {
        cpuSampledPosition: Array.from(
          this._debugSamplePositions.get(index),
        ),
        textureArrayPosition: storedPosition,
      });
    });
  }

  updateAimMaterialUniform(name, value) {
    if (this._shader?.uniforms[name]) {
      const uniformValue = this._shader.uniforms[name].value;
      if (uniformValue?.isColor) {
        uniformValue.set(value);
      } else {
        this._shader.uniforms[name].value = value;
      }
    }
  }

  setVisualPreset(name) {
    const preset = VISUAL_PRESETS[name];
    if (!preset) {
      throw new Error(
        `[BlockSurfaceHuman] Unknown visual preset: ${name}.`,
      );
    }
    Object.assign(this.visualConfig, preset, { preset: name });
    this.setBlockBaseColor(preset.baseColor);
    this.setBlockMetalness(preset.metalness);
    this.setBlockRoughness(preset.roughness);
    this.setEnvironmentIntensity(preset.envMapIntensity);
    if (this.material?.isMeshPhysicalMaterial) {
      this.material.clearcoat = preset.clearcoat;
      this.material.clearcoatRoughness =
        preset.clearcoatRoughness;
    }
  }

  setBlockBaseColor(color) {
    this.visualConfig.baseColor = new THREE.Color(color).getHex();
    this.material?.color.set(color);
    this.updateAimMaterialUniform("uAimBaseColor", color);
  }

  setBlockMetalness(value) {
    this.visualConfig.metalness = THREE.MathUtils.clamp(value, 0, 1);
    if (this.material) {
      this.material.metalness = this.visualConfig.metalness;
    }
  }

  setBlockRoughness(value) {
    this.visualConfig.roughness = THREE.MathUtils.clamp(
      value,
      0.08,
      0.75,
    );
    if (this.material) {
      this.material.roughness = this.visualConfig.roughness;
    }
    this.updateAimMaterialUniform(
      "uAimBaseRoughness",
      this.visualConfig.roughness,
    );
  }

  setEnvironmentIntensity(value) {
    this.visualConfig.envMapIntensity = Math.max(0, value);
    if (this.material) {
      this.material.envMapIntensity =
        this.visualConfig.envMapIntensity;
    }
  }

  setBlockEnvironmentIntensity(value) {
    this.setEnvironmentIntensity(value);
  }

  setHoverBrightness(value) {
    this.visualConfig.hoverBrightness = Math.max(0, value);
    this.updateAimMaterialUniform(
      "uHoverBrightness",
      this.visualConfig.hoverBrightness,
    );
  }

  setHoverEmissiveStrength(value) {
    this.visualConfig.hoverEmissiveStrength = Math.max(0, value);
    this.updateAimMaterialUniform(
      "uHoverEmissiveStrength",
      this.visualConfig.hoverEmissiveStrength,
    );
  }

  setBlocksDepthWrite(enabled) {
    this.visualConfig.depthWrite = Boolean(enabled);
    if (this.material) {
      this.material.depthWrite = this.visualConfig.depthWrite;
      this.material.needsUpdate = true;
    }
  }

  setInnerGlassVisible(visible) {
    this.setInnerCrystalVisible(visible);
  }

  setInnerCrystalVisible(enabled) {
    this.innerGlassVisible = Boolean(enabled);
    this.humanVisibleMeshes.forEach((mesh) => {
      mesh.visible =
        this.innerGlassVisible &&
        this.effectVisible &&
        this.innerCrystalDebugMode !== "particles-only";
    });
  }

  setInnerCrystalOpacity(_value) {
    if (this.innerGlassMaterial) {
      this.innerGlassMaterial.opacity = 1;
      this.innerGlassMaterial.transparent = false;
    }
  }

  setInnerCrystalTransmission(_value) {
    if (!this.innerGlassMaterial) return;
    if (this.innerGlassMaterial.transmission !== 0) {
      this.innerGlassMaterial.transmission = 0;
      this.innerGlassMaterial.needsUpdate = true;
    }
  }

  setInnerCrystalRoughness(value) {
    this.innerCrystalConfig.roughness = THREE.MathUtils.clamp(
      value,
      0,
      1,
    );
    [this.innerGlassBackMaterial, this.innerGlassMaterial].forEach(
      (material) => {
        if (material) {
          material.roughness = this.innerCrystalConfig.roughness;
        }
      },
    );
  }

  setInnerCrystalEnvironmentIntensity(value) {
    this.innerCrystalConfig.envMapIntensity = Math.max(0, value);
    [this.innerGlassBackMaterial, this.innerGlassMaterial].forEach(
      (material) => {
        if (material) {
          material.envMapIntensity =
            this.innerCrystalConfig.envMapIntensity;
        }
      },
    );
  }

  setBloomEnabled(_enabled) {
    this.visualConfig.bloomEnabled = false;
    return false;
  }

  setRotationY(rotationY) {
    if (!Number.isFinite(rotationY)) return;
    if (this.sourceRoot) this.sourceRoot.rotation.y = rotationY;
    if (this.instancedMesh) this.instancedMesh.rotation.y = rotationY;
  }

  setVisible(visible) {
    this.effectVisible = Boolean(visible);
    if (this.instancedMesh) {
      this.instancedMesh.visible =
        this.effectVisible &&
        this.innerCrystalDebugMode !== "crystal-only";
    }
    this.humanVisibleMeshes.forEach((mesh) => {
      mesh.visible =
        this.effectVisible &&
        this.innerGlassVisible &&
        this.innerCrystalDebugMode !== "particles-only";
    });
    if (!this.effectVisible) this.clearPointerInteraction();
    if (!this.effectVisible) {
      this.pointerVisualActivity = 0;
      this._particleVoxelDataValid = false;
    }
  }

  disposeSourceRoot(root) {
    const geometries = new Set();
    const materials = new Set();
    root.traverse((object) => {
      if (!object.isMesh) return;
      geometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      objectMaterials.forEach((material) => materials.add(material));
    });
    geometries.forEach((geometry) => geometry?.dispose());
    materials.forEach((material) => material?.dispose());
  }

  cleanupPartialLoad() {
    this.simulationRunning = false;
    this.autoActivate = false;
    this.detachPointerListeners();
    this.clearPointerInteraction();
    this._sdfAbortController?.abort();
    this._sdfAbortController = null;
    this._collisionAbortController?.abort();
    this._collisionAbortController = null;
    if (this.instancedMesh) this.scene?.remove(this.instancedMesh);
    if (this.simulationMesh) {
      this.simulationScene?.remove(this.simulationMesh);
    }
    if (this.voxelRangeMesh) {
      this.voxelRangeScene?.remove(this.voxelRangeMesh);
    }
    this.geometry?.dispose();
    this.basePositionTexture?.dispose();
    this.sdfTexture?.dispose();
    this.collisionTexture?.dispose();
    this.positionTargetA?.dispose();
    this.positionTargetB?.dispose();
    this.velocityTargetA?.dispose();
    this.velocityTargetB?.dispose();
    this.predictedPositionTarget?.dispose();
    this.predictedVelocityTarget?.dispose();
    this.particleScaleTargetA?.dispose();
    this.particleScaleTargetB?.dispose();
    this.particleVoxelKeyTarget?.dispose();
    this.voxelSortTargetA?.dispose();
    this.voxelSortTargetB?.dispose();
    this.voxelStartTarget?.dispose();
    this.voxelEndTarget?.dispose();
    this._particleCollisionPositionStorage?.dispose();
    this._particleCollisionVelocityStorage?.dispose();
    this.initialVelocityTexture?.dispose();
    this.initialParticleScaleTexture?.dispose();
    this.velocitySimulationMaterial?.dispose();
    this.positionSimulationMaterial?.dispose();
    this.particleScaleMaterial?.dispose();
    this.collisionPositionMaterial?.dispose();
    this.collisionVelocityMaterial?.dispose();
    this.particleVoxelKeyMaterial?.dispose();
    this.voxelSortMaterial?.dispose();
    this.voxelRangeMaterial?.dispose();
    this.particleCollisionPositionMaterial?.dispose();
    this.particleCollisionVelocityMaterial?.dispose();
    this.copyMaterial?.dispose();
    this.simulationGeometry?.dispose();
    this.voxelRangeGeometry?.dispose();
    this.customDepthMaterial?.dispose();
    this.customDistanceMaterial?.dispose();
    if (this.ownsMaterial) this.material?.dispose();
    if (this.sourceRoot) {
      this.scene?.remove(this.sourceRoot);
      this.disposeSourceRoot(this.sourceRoot);
    }
    this.sourceRoot = null;
    this.sourceMeshes = [];
    this.humanVisibleMeshes = [];
    this.humanRaycastMeshes = [];
    this.innerCrystalBackMeshes = [];
    this.innerGlassMaterial = null;
    this.innerGlassBackMaterial = null;
    this.pointerRaycastMeshes = [];
    this._pointerIntersections.length = 0;
    this.instancedMesh = null;
    this.geometry = null;
    this.positionTexture = null;
    this.basePositionTexture = null;
    this.sdfTexture = null;
    this.sdfData = null;
    this.sdfMetadata = null;
    this.collisionTexture = null;
    this.collisionData = null;
    this.collisionMetadata = null;
    this.positionData = null;
    this.customDepthMaterial = null;
    this.customDistanceMaterial = null;
    this._shader = null;
    this._depthShader = null;
    this._distanceShader = null;
    this._debugSamplePositions = null;
    this.positionTargetA = null;
    this.positionTargetB = null;
    this.velocityTargetA = null;
    this.velocityTargetB = null;
    this.predictedPositionTarget = null;
    this.predictedVelocityTarget = null;
    this.particleScaleTargetA = null;
    this.particleScaleTargetB = null;
    this.currentParticleScaleTarget = null;
    this.nextParticleScaleTarget = null;
    this.particleVoxelKeyTarget = null;
    this.voxelSortTargetA = null;
    this.voxelSortTargetB = null;
    this.currentVoxelSortTarget = null;
    this.voxelStartTarget = null;
    this.voxelEndTarget = null;
    this.particleCollisionPositionTarget = null;
    this.particleCollisionVelocityTarget = null;
    this._particleCollisionPositionStorage = null;
    this._particleCollisionVelocityStorage = null;
    this.currentPositionTarget = null;
    this.nextPositionTarget = null;
    this.currentVelocityTarget = null;
    this.nextVelocityTarget = null;
    this.initialVelocityTexture = null;
    this.initialParticleScaleTexture = null;
    this.velocitySimulationMaterial = null;
    this.positionSimulationMaterial = null;
    this.particleScaleMaterial = null;
    this.collisionPositionMaterial = null;
    this.collisionVelocityMaterial = null;
    this.particleVoxelKeyMaterial = null;
    this.voxelSortMaterial = null;
    this.voxelRangeMaterial = null;
    this.particleCollisionPositionMaterial = null;
    this.particleCollisionVelocityMaterial = null;
    this.copyMaterial = null;
    this.simulationGeometry = null;
    this.simulationScene = null;
    this.simulationCamera = null;
    this.simulationMesh = null;
    this.voxelRangeGeometry = null;
    this.voxelRangeScene = null;
    this.voxelRangeMesh = null;
    this.particleCollisionGridResolution = null;
    this.particleCollisionGridBoundsMin = null;
    this.particleCollisionGridBoundsMax = null;
    this.particleCollisionVoxelSize = null;
    this._particleVoxelDataValid = false;
    this.simulationProgress = 0;
    this.pointerVisualActivity = 0;
    this.simulationInitialized = false;
    if (this.ownsMaterial) this.material = null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    // Remove the generated mesh and release owned resources exactly once.
    this.cleanupPartialLoad();
    this.loadPromise = null;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.prepareModel = null;
    this.onProgress = null;
  }
}
