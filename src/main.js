import * as THREE from "three";

import { createStars } from "./backdrop.js";
import { createSystem } from "./system.js";
import { initHud } from "./hud.js";
import { initControls } from "./input.js";
import { createOrbitCamera } from "./camera.js";
import { PLANETAS } from "./data.js";

const canvas = document.querySelector("#scene");
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
    movil ? 50 : 42,
    window.innerWidth / window.innerHeight,
    0.1,
    500,
  );
  camara.up.set(0, 1, 0);

  const uTime = { value: 0 };

  const sistema = createSystem({ scene: escena });

  const estrellas = createStars({
    count: calidad.stars,
    pixelRatio: calidad.dpr,
    uTime,
  });
  escena.add(estrellas.points);

  const controlCamara = createOrbitCamera(camara, {
    systemRadius: movil ? 50 : 23,
    focusRadius: movil ? 16 : 13.5,
    phi: 1.27,
  });
  controlCamara.update(0.016, null);

  const etiquetas = {
    star: document.querySelector('[data-label="star"]'),
    planet: document.querySelector('[data-label="planet"]'),
    planetText: document.querySelector('[data-label="planet"] [data-label-text]'),
    satellite: document.querySelector('[data-label="satellite"]'),
    satelliteText: document.querySelector('[data-label="satellite"] [data-label-text]'),
  };

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tmpPlaneta = new THREE.Vector3();

  let parada = -1;

  const hud = initHud({
    onSystem: () => deseleccionar(),
    onPlanet: (i) => seleccionar(i),
    onProject: (id) => abrirProyecto(id),
  });

  function etiquetarPlaneta(indice) {
    const datos = PLANETAS[indice];
    if (!datos) return;
    if (etiquetas.planet) etiquetas.planet.style.color = datos.color;
    if (etiquetas.planetText) etiquetas.planetText.textContent = datos.nombre;
    etiquetarProyecto(datos.proyectos[0]);
  }

  function etiquetarProyecto(proyecto) {
    if (!proyecto) return;
    if (etiquetas.satellite) etiquetas.satellite.style.color = proyecto.color;
    if (etiquetas.satelliteText) etiquetas.satelliteText.textContent = proyecto.nombre;
  }

  function seleccionar(indice) {
    if (indice < 0 || indice >= PLANETAS.length) return;
    parada = indice;
    sistema.setSelection(indice);
    sistema.setProject(null);
    sistema.setMode("planet");
    hud.setStop(indice);
    controlCamara.setFocus(true);
    etiquetarPlaneta(indice);
  }

  function abrirProyecto(id, indice = parada) {
    if (indice < 0 || indice >= PLANETAS.length) return;
    const proyecto = PLANETAS[indice].proyectos.find((p) => p.id === id);
    if (!proyecto) return;
    parada = indice;
    sistema.setSelection(indice);
    sistema.setProject(id);
    sistema.setMode("project");
    hud.setStop(indice);
    hud.setProject(proyecto);
    controlCamara.setFocus(true);
    etiquetarPlaneta(indice);
    etiquetarProyecto(proyecto);
  }

  function deseleccionar() {
    parada = -1;
    sistema.setSelection(-1);
    sistema.setProject(null);
    sistema.setMode("system");
    hud.setStop(-1);
    controlCamara.setFocus(false);
  }

  initControls({
    onRotate: (dx, dy) => controlCamara.rotate(dx, dy),
    onPan: (dx, dy) => controlCamara.pan(dx, dy),
    onZoom: (delta) => controlCamara.zoom(delta),
    onClick: (x, y) => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(
        ((x - rect.left) / rect.width) * 2 - 1,
        -((y - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camara);
      const impactos = raycaster.intersectObjects(sistema.pickables, false);
      if (impactos.length === 0) {
        deseleccionar();
        return;
      }
      const datos = impactos[0].object.userData;
      if (datos.tipo === "planeta") seleccionar(datos.indice);
      else if (datos.tipo === "proyecto") abrirProyecto(datos.proyecto, datos.indice);
    },
  });

  sistema.setMode("system");
  sistema.setSelection(-1);
  hud.setStop(-1);
  etiquetarPlaneta(0);

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
    estrellas.material.uniforms.uPixelRatio.value = calidad.dpr;
  }

  window.addEventListener("resize", redimensionar);

  let ultimo = performance.now();

  function bucle(ahora) {
    const dt = Math.min((ahora - ultimo) / 1000, 0.05);
    ultimo = ahora;
    uTime.value += dt;

    sistema.update(dt, uTime.value, camara);
    const foco = parada >= 0 ? sistema.planetPosition(parada, tmpPlaneta) : null;
    controlCamara.update(dt, foco);

    const posiciones = sistema.labels();
    colocarEtiqueta(etiquetas.star, posiciones.star);
    colocarEtiqueta(etiquetas.planet, posiciones.planet);
    colocarEtiqueta(etiquetas.satellite, posiciones.satellite);

    renderer.render(escena, camara);
    requestAnimationFrame(bucle);
  }

  requestAnimationFrame(bucle);
}
