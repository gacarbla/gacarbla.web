import * as THREE from "three";

/** Superficie de la estrella: color sólido con oscurecimiento de limbo. */
export function starMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(cameraPosition - vWorld);
        float frente = clamp(dot(N, V), 0.0, 1.0);
        vec3 borde = vec3(1.0, 0.42, 0.12);
        vec3 centro = vec3(1.0, 0.97, 0.82);
        gl_FragColor = vec4(mix(borde, centro, pow(frente, 0.45)), 1.0);
      }
    `,
  });
}

/** Halo plano, siempre de cara a la cámara, para el resplandor de la estrella. */
export function haloMaterial(color, intensity = 1) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = pow(max(0.0, 1.0 - d), 3.0);
        gl_FragColor = vec4(uColor * a * uIntensity, a * uIntensity);
      }
    `,
  });
}

/**
 * Halo aditivo para la estrella y para marcar el planeta o el satélite
 * seleccionado. No es un anillo: es un resplandor alrededor del cuerpo.
 */
export function glowMaterial(color, intensity = 1) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(cameraPosition - vWorld);
        float rim = pow(1.0 - abs(dot(N, V)), 2.4);
        gl_FragColor = vec4(uColor * rim * uIntensity, rim * uIntensity);
      }
    `,
  });
}

/** Estrellas del fondo: puntos suaves con atenuación por distancia. */
export function pointsMaterial(uTime, uPixelRatio, twinkle = 0) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime,
      uPixelRatio: { value: uPixelRatio },
      uTwinkle: { value: twinkle },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute vec3 aColor;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uTwinkle;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = mix(1.0, 0.55 + 0.45 * sin(uTime * 1.2 + aPhase), uTwinkle);
        vAlpha = tw;
        vColor = aColor;
        gl_PointSize = aSize * uPixelRatio * (260.0 / max(-mv.z, 0.001));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = 1.0 - smoothstep(0.06, 0.5, d);
        gl_FragColor = vec4(vColor * a * vAlpha, a * vAlpha);
      }
    `,
  });
}
