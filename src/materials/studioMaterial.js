import * as THREE from "three";

export const STUDIO_COLOR = new THREE.Color(0x090d14);

const FLOOR_OPACITY = 0.95;
const BACKGROUND_TOP_COLOR = new THREE.Color(0x101925);
const BACKGROUND_CENTER_COLOR = new THREE.Color(0x0b111a);

/** Creates the subtle reflective layer over the studio floor. */
export function createStudioFloorMaterial(alphaMap) {
  return new THREE.MeshBasicMaterial({
    color: STUDIO_COLOR.clone(),
    alphaMap,
    transparent: true,
    opacity: FLOOR_OPACITY,
    depthWrite: false,
  });
}

/** Creates the matte material shared by the curved studio floor and backdrop. */
export function createStudioCycloramaMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      bottomColor: { value: STUDIO_COLOR.clone() },
      centerColor: { value: BACKGROUND_CENTER_COLOR.clone() },
      topColor: { value: BACKGROUND_TOP_COLOR.clone() },
    },
    vertexShader: `
      varying float vScreenY;

      void main() {
        vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vScreenY = clipPosition.y / clipPosition.w * 0.5 + 0.5;
        gl_Position = clipPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 bottomColor;
      uniform vec3 centerColor;
      uniform vec3 topColor;
      varying float vScreenY;

      void main() {
        float screenY = clamp(vScreenY, 0.0, 1.0);
        vec3 lower = mix(bottomColor, centerColor, smoothstep(0.0, 0.55, screenY));
        vec3 color = mix(lower, topColor, smoothstep(0.45, 1.0, screenY));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}

/** Creates a dark three-stop vertical gradient for the studio background. */
export function createStudioBackgroundMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      bottomColor: { value: STUDIO_COLOR.clone() },
      centerColor: { value: BACKGROUND_CENTER_COLOR.clone() },
      topColor: { value: BACKGROUND_TOP_COLOR.clone() },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 bottomColor;
      uniform vec3 centerColor;
      uniform vec3 topColor;
      varying vec2 vUv;

      void main() {
        vec3 lower = mix(bottomColor, centerColor, smoothstep(0.0, 0.55, vUv.y));
        vec3 color = mix(lower, topColor, smoothstep(0.45, 1.0, vUv.y));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
  });
}
