import * as THREE from "three";
import { pointsMaterial } from "./materials.js";

/** Generador determinista para que la escena sea siempre la misma. */
function rng(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.4)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Galaxia espiral de partículas. Vive muy por detrás del sistema y gira
 * despacio; es el fondo de toda la escena.
 */
export function createGalaxy({ count, radius, pixelRatio, uTime }) {
  const random = rng(19);
  const arms = 4;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const core = new THREE.Color("#ffd9b0").convertSRGBToLinear();
  const mid = new THREE.Color("#6d8bff").convertSRGBToLinear();
  const outer = new THREE.Color("#a97bff").convertSRGBToLinear();
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const t = Math.pow(random(), 0.62);
    const r = 4 + t * (radius - 4);
    const arm = Math.floor(random() * arms);
    const spread = (1 - t * 0.72) * 1.1 + 0.18;
    const angle = r * 0.052 + arm * ((Math.PI * 2) / arms) + (random() - 0.5) * spread;
    const y = (random() - 0.5) * (0.7 + t * 3.4);
    const jitter = (random() - 0.5) * 2.4;

    positions[i * 3] = Math.cos(angle) * r + jitter;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * r + jitter;

    if (t < 0.42) color.copy(core).lerp(mid, t / 0.42);
    else color.copy(mid).lerp(outer, (t - 0.42) / 0.58);
    const warmth = 0.58 + random() * 0.42;
    colors[i * 3] = color.r * warmth;
    colors[i * 3 + 1] = color.g * warmth;
    colors[i * 3 + 2] = color.b * warmth;

    sizes[i] = (0.45 + random() * 1.6) * (1.12 - t * 0.3);
    phases[i] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

  const material = pointsMaterial(uTime, pixelRatio, 0);
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: softTexture(),
      color: new THREE.Color("#ffcf9f"),
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.scale.setScalar(22);

  const group = new THREE.Group();
  group.position.set(0, -8, -122);
  group.rotation.set(0.88, 0, 0.2);
  group.add(points);
  group.add(halo);

  return {
    group,
    material,
    update(dt) {
      points.rotation.y += dt * 0.0055;
    },
  };
}

/** Campo de estrellas lejanas con parpadeo. */
export function createStars({ count, pixelRatio, uTime }) {
  const random = rng(53);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const warm = new THREE.Color("#fff1d6").convertSRGBToLinear();
  const cool = new THREE.Color("#b9d4ff").convertSRGBToLinear();
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const r = 90 + random() * 190;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.75;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

    color.copy(random() > 0.7 ? warm : cool);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = 0.3 + Math.pow(random(), 2.2) * 1.4;
    phases[i] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

  const material = pointsMaterial(uTime, pixelRatio, 1);
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return { points, material };
}

/** Polvo cercano a la cámara: bokeh que da profundidad al plano. */
export function createBokeh({ count, pixelRatio, uTime }) {
  const random = rng(233);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const cold = new THREE.Color("#9fd4ff").convertSRGBToLinear();
  const warm = new THREE.Color("#ffc98f").convertSRGBToLinear();
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const r = 8 + random() * 20;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.6;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

    color.copy(random() > 0.75 ? warm : cold);
    colors[i * 3] = color.r * 0.18;
    colors[i * 3 + 1] = color.g * 0.18;
    colors[i * 3 + 2] = color.b * 0.18;

    sizes[i] = 1.1 + random() * 2.6;
    phases[i] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

  const material = pointsMaterial(uTime, pixelRatio, 1);
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    material,
    update(dt) {
      points.rotation.y += dt * 0.004;
      points.rotation.x += dt * 0.0015;
    },
  };
}

/** Manchas de nebulosa con textura suave, sin geometría pesada. */
export function createNebula() {
  const texture = softTexture();

  const group = new THREE.Group();
  const random = rng(101);
  const tints = ["#24327a", "#4a1f6b", "#123a5c", "#2a1b52", "#1b3a6b"];

  for (let i = 0; i < 5; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(tints[i]),
      transparent: true,
      opacity: 0.18 + random() * 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set((random() - 0.5) * 130, (random() - 0.5) * 70, -60 - random() * 60);
    const scale = 55 + random() * 70;
    sprite.scale.set(scale, scale, 1);
    sprite.material.rotation = random() * Math.PI;
    group.add(sprite);
  }

  return {
    group,
    update(t) {
      group.children.forEach((sprite, i) => {
        sprite.material.rotation = i * 0.7 + t * 0.002 * (i % 2 === 0 ? 1 : -1);
      });
    },
  };
}
