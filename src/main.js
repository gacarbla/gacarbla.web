import * as THREE from "three";

import { createStars } from "./backdrop.js";
import { createSystem } from "./system.js";
import { initHud } from "./hud.js";
import { initInput } from "./input.js";
import { PLANETAS } from "./data.js";

const canvas = document.querySelector("#scene");
const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const tactil = window.matchMedia("(pointer: coarse)").matches;
const movil = tactil || window.innerWidth < 860;

const calidad = {
  stars: movil ? 1400 : 3200,
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
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#04050a");

  const camara = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    500,
  );

  const uTime = { value: 0 };

  const sistema = createSystem({ scene: escena });

  const estrellas = createStars({
    count: calidad.stars,
    pixelRatio: calidad.dpr,
    uTime,
  });
  escena.add(estrellas.points);

  const objetivoCamara = new THREE.Vector3(0, 0, 0);
  let baseY = 4.2;

  /** En vertical, la escena se inclina y se aleja para caber a lo alto. */
  function orientar() {
    const aspecto = window.innerWidth / window.innerHeight;
    const vertical = aspecto < 0.85;
    const giro = vertical ? 0.95 : 0;
    baseY = vertical ? 6.0 : 5.0;
    camara.position.set(0, baseY, vertical ? 20.5 : 15.5);
    camara.up.set(Math.sin(giro), Math.cos(giro), 0);
    objetivoCamara.set(0, vertical ? 1.0 : 0, 0);
    camara.lookAt(objetivoCamara);
  }
  orientar();

  const etiquetas = {
    star: document.querySelector('[data-label="star"]'),
    planet: document.querySelector('[data-label="planet"]'),
    planetText: document.querySelector('[data-label="planet"] [data-label-text]'),
    satellite: document.querySelector('[data-label="satellite"]'),
    satelliteText: document.querySelector('[data-label="satellite"] [data-label-text]'),
  };

  const PARADAS = [-1, ...PLANETAS.map((_, i) => i)];
  let parada = -1;
  let bloqueo = 0;

  const hud = initHud({
    onSystem: () => irA(-1),
    onPlanet: (i) => irA(i),
    onProject: (id) => abrirProyecto(id),
  });

  function etiquetar(i) {
    const datos = PLANETAS[i];
    if (!datos) return;
    if (etiquetas.planet) etiquetas.planet.style.color = datos.color;
    if (etiquetas.planetText) etiquetas.planetText.textContent = datos.nombre;
    const proyecto = datos.proyectos[0];
    if (proyecto) {
      if (etiquetas.satellite) etiquetas.satellite.style.color = proyecto.color;
      if (etiquetas.satelliteText) etiquetas.satelliteText.textContent = proyecto.nombre;
    }
  }

  function irA(indice) {
    parada = indice;
    const modo = indice < 0 ? "system" : "planet";
    sistema.setProject(false);
    sistema.setMode(modo);
    sistema.setSelection(indice);
    hud.setStop(indice);
    if (indice >= 0) etiquetar(indice);
    bloqueo = performance.now() + 820;
  }

  function abrirProyecto(id) {
    if (parada < 0) return;
    const datos = PLANETAS[parada];
    const proyecto = datos?.proyectos.find((p) => p.id === id);
    if (!proyecto) return;
    sistema.setProject(true);
    sistema.setMode("project");
    hud.setProject(proyecto);
    etiquetar(parada);
    bloqueo = performance.now() + 420;
  }

  function mover(direccion) {
    if (performance.now() < bloqueo) return;
    const actual = PARADAS.indexOf(parada);
    const siguiente = PARADAS[(actual + direccion + PARADAS.length) % PARADAS.length];
    irA(siguiente);
  }

  initInput({
    next: () => mover(1),
    prev: () => mover(-1),
    isLocked: () => performance.now() < bloqueo,
  });

  sistema.setMode("system");
  sistema.setSelection(-1);
  hud.setStop(-1);
  etiquetar(0);

  const proyectado = new THREE.Vector3();

  /** Coloca una etiqueta HTML sobre un punto del mundo. */
  function colocarEtiqueta(elemento, posicion) {
    if (!elemento) return;
    proyectado.copy(posicion).project(camara);
    if (proyectado.z > 1) {
      elemento.style.visibility = "hidden";
      return;
    }
    elemento.style.visibility = "visible";
    const x = (proyectado.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-proyectado.y * 0.5 + 0.5) * window.innerHeight;
    elemento.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  function redimensionar() {
    renderer.setPixelRatio(calidad.dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    orientar();
    estrellas.material.uniforms.uPixelRatio.value = calidad.dpr;
  }

  window.addEventListener("resize", redimensionar);

  let ultimo = performance.now();

  function bucle(ahora) {
    const dt = Math.min((ahora - ultimo) / 1000, 0.05);
    ultimo = ahora;
    uTime.value += dt;

    sistema.update(dt, uTime.value, camara);

    if (!reducido) {
      camara.position.y = baseY + Math.sin(uTime.value * 0.25) * 0.05;
      camara.position.x = Math.sin(uTime.value * 0.18) * 0.04;
    }
    camara.lookAt(objetivoCamara);

    const posiciones = sistema.labels();
    colocarEtiqueta(etiquetas.star, posiciones.star);
    colocarEtiqueta(etiquetas.planet, posiciones.planet);
    colocarEtiqueta(etiquetas.satellite, posiciones.satellite);

    renderer.render(escena, camara);
    requestAnimationFrame(bucle);
  }

  requestAnimationFrame(bucle);
}
