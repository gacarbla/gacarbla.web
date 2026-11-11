import * as THREE from "three";
import {
  planetMaterial,
  moonMaterial,
  atmosphereMaterial,
  pointsMaterial,
} from "./materials.js";

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

/** Anillos de polvo: partículas finas con huecos, en el plano del planeta. */
function createRings({ count, pixelRatio, uTime }) {
  const random = rng(907);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const cold = new THREE.Color("#c8e8ff").convertSRGBToLinear();
  const warm = new THREE.Color("#ffe2c0").convertSRGBToLinear();
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    let r = 0;
    let intentos = 0;
    do {
      r = 3.1 + random() * 1.85;
      intentos += 1;
    } while (Math.sin(r * 8.0 + 0.6) < -0.55 && intentos < 12);

    const a = random() * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = (random() - 0.5) * 0.035;
    positions[i * 3 + 2] = Math.sin(a) * r;

    color.copy(random() > 0.85 ? warm : cold);
    const fade = 0.16 + random() * 0.3;
    colors[i * 3] = color.r * fade;
    colors[i * 3 + 1] = color.g * fade;
    colors[i * 3 + 2] = color.b * fade;

    sizes[i] = 0.06 + Math.pow(random(), 2.2) * 0.26;
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
  return { points, material };
}

/** Polvo orbital: partículas finas alrededor del planeta. */
function createDust({ count, pixelRatio, uTime }) {
  const random = rng(311);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const cold = new THREE.Color("#8fd7ff").convertSRGBToLinear();
  const warm = new THREE.Color("#ffd7a8").convertSRGBToLinear();
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const r = 2.7 + random() * 2.3;
    const a = random() * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r + (random() - 0.5) * 0.3;
    positions[i * 3 + 1] = (random() - 0.5) * 0.22;
    positions[i * 3 + 2] = Math.sin(a) * r + (random() - 0.5) * 0.3;

    color.copy(random() > 0.9 ? warm : cold);
    const fade = 0.14 + random() * 0.26;
    colors[i * 3] = color.r * fade;
    colors[i * 3 + 1] = color.g * fade;
    colors[i * 3 + 2] = color.b * fade;

    sizes[i] = 0.1 + Math.pow(random(), 2) * 0.4;
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
  points.rotation.x = 0.06;
  return { points, material };
}

/**
 * El sistema: planeta personal, anillos, luna del portfolio y polvo.
 * Todo se mueve de forma continua; la luna puede congelarse al enfocarla.
 */
export function createWorld({ scene, quality, uTime, pixelRatio }) {
  const light = new THREE.Vector3(0.72, 0.42, 0.55).normalize();
  const group = new THREE.Group();
  scene.add(group);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 160, 110),
    planetMaterial(light),
  );
  group.add(planet);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.44, 96, 64),
    atmosphereMaterial(),
  );
  group.add(atmosphere);

  const anillos = createRings({ ...quality.rings, pixelRatio, uTime });
  anillos.points.rotation.set(0.1, 0, -0.18);
  group.add(anillos.points);

  const tilt = new THREE.Group();
  tilt.rotation.set(0.22, 0, -0.1);
  group.add(tilt);

  const spin = new THREE.Group();
  tilt.add(spin);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 96, 64),
    moonMaterial(light),
  );
  moon.position.set(6.3, 0, 0);
  spin.add(moon);

  const orbitPoints = [];
  for (let i = 0; i <= 256; i += 1) {
    const a = (i / 256) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(Math.cos(a) * 6.3, 0, Math.sin(a) * 6.3));
  }
  const orbit = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(orbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x4d7dff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  tilt.add(orbit);

  const dust = createDust({ ...quality.dust, pixelRatio, uTime });
  group.add(dust.points);

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.97, 1.0, 96),
    new THREE.MeshBasicMaterial({
      color: 0x7ce7ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  marker.scale.setScalar(1.0);
  scene.add(marker);

  const planetMaterialRef = planet.material;
  let orbitAngle = 0.6;
  let frozen = false;
  let focus = 0;

  const worldPosition = new THREE.Vector3();

  return {
    group,
    moon,
    setFrozen(value) {
      frozen = value;
    },
    setFocus(value) {
      focus = value;
      marker.material.opacity = Math.max(0, 0.3 * (1 - focus * 1.15));
      marker.scale.setScalar(0.82);
    },
    setPixelRatio(value) {
      dust.material.uniforms.uPixelRatio.value = value;
      anillos.material.uniforms.uPixelRatio.value = value;
    },
    getMoonPosition(target = new THREE.Vector3()) {
      return moon.getWorldPosition(target);
    },
    update(dt, camera) {
      planet.rotation.y += dt * 0.028;
      anillos.points.rotation.y += dt * 0.004;
      moon.rotation.y += dt * 0.05;
      dust.points.rotation.y -= dt * 0.02;
      if (!frozen) orbitAngle += dt * 0.05;
      spin.rotation.y = orbitAngle;
      planetMaterialRef.uniforms.uTime.value = uTime.value;

      moon.getWorldPosition(worldPosition);
      marker.position.copy(worldPosition);
      marker.quaternion.copy(camera.quaternion);
      marker.rotateZ(worldPosition.x * 0.01);
    },
  };
}
