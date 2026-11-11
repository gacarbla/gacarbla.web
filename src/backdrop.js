import * as THREE from "three";
import { pointsMaterial } from "./materials.js";

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

/** Campo de estrellas lejanas. Sin galaxia: solo el cielo de fondo. */
export function createStars({ count, pixelRatio, uTime }) {
  const random = rng(53);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const warm = new THREE.Color("#fff1d6").convertSRGBToLinear();
  const cool = new THREE.Color("#bcd6ff").convertSRGBToLinear();
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const r = 80 + random() * 200;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.8;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

    color.copy(random() > 0.78 ? warm : cool);
    const fade = 0.45 + random() * 0.55;
    colors[i * 3] = color.r * fade;
    colors[i * 3 + 1] = color.g * fade;
    colors[i * 3 + 2] = color.b * fade;

    sizes[i] = 0.25 + Math.pow(random(), 2.4) * 1.2;
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
