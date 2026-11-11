import * as THREE from "three";

/** Ruido de valor 3D reutilizable en los materiales procedurales. */
const NOISE = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec3(1.7);
      a *= 0.5;
    }
    return v;
  }
`;

/** Planeta principal: océano, continentes, hielo, terminador y atmósfera. */
export function planetMaterial(light) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLight: { value: light.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec3 vObj;
      void main() {
        vObj = position;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform float uTime;
      uniform vec3 uLight;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec3 vObj;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 L = normalize(uLight);
        vec3 V = normalize(cameraPosition - vWorld);
        float ndl = dot(N, L);
        float day = smoothstep(-0.22, 0.38, ndl);

        vec3 p = normalize(vObj);
        float h = fbm(p * 2.35 + vec3(0.0, 0.0, uTime * 0.004));
        float detail = fbm(p * 7.5 + 3.1);
        float land = smoothstep(0.47, 0.55, h);

        vec3 ocean = mix(vec3(0.006, 0.03, 0.10), vec3(0.016, 0.13, 0.21), smoothstep(0.18, 0.5, h));
        vec3 ground = mix(vec3(0.04, 0.20, 0.18), vec3(0.10, 0.40, 0.30), detail);
        vec3 surf = mix(ocean, ground, land);

        float ice = smoothstep(0.84, 0.98, abs(p.y));
        surf = mix(surf, vec3(0.72, 0.86, 0.93), ice * 0.55);

        float sun = max(ndl, 0.0);
        vec3 col = surf * (0.07 + 1.75 * smoothstep(0.0, 0.62, sun));

        float clouds = smoothstep(0.56, 0.78, fbm(p * 4.4 + vec3(uTime * 0.006, 0.0, 0.0)));
        vec3 cloudColor = vec3(0.86, 0.93, 1.0) * (0.12 + 0.95 * smoothstep(0.0, 0.6, sun));
        col = mix(col, cloudColor, clouds * 0.42);

        col += vec3(1.0, 0.48, 0.2) * pow(1.0 - abs(ndl), 8.0) * 0.12;

        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        col += vec3(0.16, 0.52, 1.0) * fres * (0.28 + 0.72 * day);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/** Luna: gris craterizado con un borde frío. */
export function moonMaterial(light) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uLight: { value: light.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec3 vObj;
      void main() {
        vObj = position;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform vec3 uLight;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec3 vObj;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 L = normalize(uLight);
        vec3 V = normalize(cameraPosition - vWorld);
        float ndl = dot(N, L);
        float day = smoothstep(-0.3, 0.4, ndl);

        vec3 p = normalize(vObj);
        float craters = fbm(p * 9.0);
        float grit = fbm(p * 26.0);
        vec3 surf = mix(vec3(0.16, 0.17, 0.20), vec3(0.52, 0.53, 0.56), craters * 0.75 + grit * 0.25);

        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        vec3 col = surf * (0.03 + 1.5 * smoothstep(0.0, 0.6, max(ndl, 0.0)));
        col += vec3(0.2, 0.5, 1.0) * fres * (0.15 + 0.5 * day);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/** Halo atmosférico del planeta. */
export function atmosphereMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(cameraPosition - vWorld);
        float rim = pow(1.0 - abs(dot(N, V)), 2.6);
        vec3 color = mix(vec3(0.12, 0.42, 1.0), vec3(0.35, 0.85, 1.0), rim);
        gl_FragColor = vec4(color * rim, rim * 0.9);
      }
    `,
  });
}

/** Partículas (galaxia, estrellas, polvo): puntos suaves con atenuación. */
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
