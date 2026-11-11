import * as THREE from "three";

import { createGalaxy, createStars, createNebula, createBokeh } from "./backdrop.js";
import { createWorld } from "./world.js";
import { initHud } from "./hud.js";
import { initInput } from "./input.js";

const canvas = document.querySelector("#scene");
const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const tactil = window.matchMedia("(pointer: coarse)").matches;
const movil = tactil || window.innerWidth < 860;

const calidad = {
  galaxy: movil ? 20000 : 42000,
  stars: movil ? 1700 : 3800,
  dust: { count: movil ? 600 : 1400 },
  rings: { count: movil ? 7000 : 18000 },
  dpr: Math.min(window.devicePixelRatio || 1, movil ? 1.35 : 1.65),
};

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    stencil: false,
    alpha: false,
    powerPreference: "high-performance",
  });
} catch {
  document.body.classList.add("sin-webgl");
}

if (renderer) {
  arrancar();
}

function arrancar() {
  renderer.setPixelRatio(calidad.dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#04050a");

  const camara = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    600,
  );

  const uTime = { value: 0 };

  const galaxia = createGalaxy({
    count: calidad.galaxy,
    radius: 80,
    pixelRatio: calidad.dpr,
    uTime,
  });
  escena.add(galaxia.group);

  const estrellas = createStars({
    count: calidad.stars,
    pixelRatio: calidad.dpr,
    uTime,
  });
  escena.add(estrellas.points);

  const nebulosa = createNebula();
  escena.add(nebulosa.group);

  const bokeh = createBokeh({
    count: movil ? 90 : 220,
    pixelRatio: calidad.dpr,
    uTime,
  });
  escena.add(bokeh.points);

  const mundo = createWorld({
    scene: escena,
    quality: calidad,
    uTime,
    pixelRatio: calidad.dpr,
  });

  const ETAPAS = [
    {
      pos: new THREE.Vector3(0, 4.8, 19.5),
      target: new THREE.Vector3(0, 0, 0),
      fov: 45,
    },
    {
      pos: new THREE.Vector3(5.8, 2.7, 12.8),
      target: new THREE.Vector3(0, 0, 0),
      fov: 38,
    },
    { luna: true, fov: 36 },
  ];

  let etapa = 0;
  let transicion = null;
  let vista = null;
  const objetivo = new THREE.Vector3();
  const vaiven = new THREE.Vector3();

  const hud = initHud();

  /** Factor de encuadre para pantallas verticales. */
  function encaje() {
    const aspecto = window.innerWidth / window.innerHeight;
    if (aspecto < 0.85) return 1.55;
    if (aspecto < 1.15) return 1.22;
    return 1;
  }

  /** Posición, objetivo y fov de una etapa. */
  function vistaDe(indice) {
    const etapaDef = ETAPAS[indice];
    const fit = encaje();

    if (etapaDef.luna) {
      const centro = mundo.getMoonPosition(new THREE.Vector3());
      const fuera = centro.clone().normalize();
      const pos = centro
        .clone()
        .addScaledVector(fuera, 3.5 * fit)
        .add(new THREE.Vector3(0, 1.05 * fit, 0));
      return { pos, target: centro, fov: etapaDef.fov };
    }

    const target = etapaDef.target.clone();
    const pos = target
      .clone()
      .add(etapaDef.pos.clone().sub(target).multiplyScalar(fit));
    return { pos, target, fov: etapaDef.fov };
  }

  function curva(a, b) {
    const medio = a.clone().add(b).multiplyScalar(0.5);
    const distancia = a.distanceTo(b);
    medio.y += distancia * 0.14;
    medio.x += distancia * 0.05;
    return (t) =>
      new THREE.Vector3()
        .copy(a)
        .multiplyScalar((1 - t) * (1 - t))
        .addScaledVector(medio, 2 * (1 - t) * t)
        .addScaledVector(b, t * t);
  }

  const suavizar = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function aplicarEtapa(indice, inmediato = false) {
    if (indice < 0 || indice >= ETAPAS.length) return;
    if (!inmediato && (indice === etapa || transicion)) return;

    mundo.setFrozen(indice === 2);
    const destino = vistaDe(indice);

    if (inmediato) {
      vista = destino;
      etapa = indice;
      camara.position.copy(destino.pos);
      objetivo.copy(destino.target);
      camara.fov = destino.fov;
      camara.updateProjectionMatrix();
      camara.lookAt(objetivo);
      mundo.setFocus(indice === 2 ? 1 : 0);
      hud.setStage(indice);
      return;
    }

    const from = {
      pos: camara.position.clone(),
      target: objetivo.clone(),
      fov: camara.fov,
    };
    transicion = {
      from,
      to: destino,
      path: curva(from.pos, destino.pos),
      t: 0,
      duracion: reducido ? 0.5 : movil ? 1.7 : 2.0,
    };
    etapa = indice;
    mundo.setFocus(indice === 2 ? 1 : 0);
    hud.setStage(indice);
  }

  initInput({
    next: () => aplicarEtapa(etapa + 1),
    prev: () => aplicarEtapa(etapa - 1),
    goTo: (indice) => aplicarEtapa(indice),
    isLocked: () => transicion !== null,
  });

  aplicarEtapa(0, true);

  function redimensionar() {
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    renderer.setPixelRatio(calidad.dpr);
    renderer.setSize(ancho, alto);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();

    galaxia.material.uniforms.uPixelRatio.value = calidad.dpr;
    estrellas.material.uniforms.uPixelRatio.value = calidad.dpr;
    bokeh.material.uniforms.uPixelRatio.value = calidad.dpr;
    mundo.setPixelRatio(calidad.dpr);

    if (!transicion) {
      vista = vistaDe(etapa);
      objetivo.copy(vista.target);
      camara.fov = vista.fov;
      camara.updateProjectionMatrix();
    }
  }

  window.addEventListener("resize", redimensionar);

  let ultimo = performance.now();

  function bucle(ahora) {
    const dt = Math.min((ahora - ultimo) / 1000, 0.05);
    ultimo = ahora;
    uTime.value += dt;

    galaxia.update(dt);
    nebulosa.update(uTime.value);
    bokeh.update(dt);

    if (transicion) {
      transicion.t += dt / transicion.duracion;
      const bruto = Math.min(1, transicion.t);
      const t = suavizar(bruto);
      camara.position.copy(transicion.path(t));
      objetivo.lerpVectors(transicion.from.target, transicion.to.target, t);
      camara.fov = THREE.MathUtils.lerp(transicion.from.fov, transicion.to.fov, t);
      camara.updateProjectionMatrix();

      if (bruto >= 1) {
        camara.position.copy(transicion.to.pos);
        objetivo.copy(transicion.to.target);
        camara.fov = transicion.to.fov;
        camara.updateProjectionMatrix();
        vista = transicion.to;
        transicion = null;
      }
    } else if (vista) {
      if (!reducido) {
        vaiven.set(
          Math.sin(uTime.value * 0.24) * 0.06,
          Math.cos(uTime.value * 0.2) * 0.05,
          0,
        );
      } else {
        vaiven.set(0, 0, 0);
      }
      camara.position.copy(vista.pos).add(vaiven);
      objetivo.copy(vista.target);
    }

    camara.lookAt(objetivo);
    mundo.update(dt, camara);
    renderer.render(escena, camara);
    requestAnimationFrame(bucle);
  }

  requestAnimationFrame(bucle);
}
