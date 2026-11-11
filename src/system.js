import * as THREE from "three";
import { glowMaterial, starMaterial, haloMaterial } from "./materials.js";
import { PLANETAS } from "./data.js";

const RADIO_ORBITA = 4.8;
const RADIO_PLANETA = 0.85;
const RADIO_LUNA = 0.24;
const BAHIA = 0.6;
const VELOCIDAD = 0.09;

/**
 * Sistema orbital: estrella central, un planeta por rama y una luna por
 * proyecto. Los planetas comparten órbita y el sistema gira para llevar
 * el seleccionado a la bahía.
 */
export function createSystem({ scene }) {
  const grupo = new THREE.Group();
  scene.add(grupo);

  // Estrella
  const estrella = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 48), starMaterial());
  grupo.add(estrella);

  const corona = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 48), glowMaterial("#ffb066", 0.9));
  const aureola = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), haloMaterial("#ff9a4d", 0.42));
  aureola.renderOrder = -1;
  grupo.add(corona, aureola);

  const luz = new THREE.PointLight(0xffd7a1, 150, 0, 2);
  grupo.add(luz);
  grupo.add(new THREE.AmbientLight(0x2f4f8a, 2.7));

  // Plano orbital compartido
  const plano = new THREE.Group();
  plano.rotation.x = 0.16;
  grupo.add(plano);
  plano.add(crearOrbita(RADIO_ORBITA, "#6f8fff", 0.15));

  const pivote = new THREE.Group();
  plano.add(pivote);

  const base = PLANETAS.map((_, i) => (i * Math.PI * 2) / PLANETAS.length);
  const mundos = PLANETAS.map((datos, i) => {
    const ancla = new THREE.Group();
    ancla.position.set(
      RADIO_ORBITA * Math.cos(base[i]),
      0,
      -RADIO_ORBITA * Math.sin(base[i]),
    );
    pivote.add(ancla);

    const planeta = new THREE.Mesh(
      new THREE.SphereGeometry(RADIO_PLANETA, 64, 48),
      new THREE.MeshStandardMaterial({ color: datos.color, roughness: 0.62, metalness: 0.02 }),
    );
    ancla.add(planeta);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(RADIO_PLANETA * 1.5, 48, 32),
      glowMaterial(datos.color, 0),
    );
    ancla.add(halo);

    const proyecto = datos.proyectos[0];
    const planoLuna = new THREE.Group();
    planoLuna.rotation.x = 0.55;
    ancla.add(planoLuna);
    planoLuna.add(crearOrbita(1.6, proyecto.color, 0.16));

    const pivoteLuna = new THREE.Group();
    planoLuna.add(pivoteLuna);

    const luna = new THREE.Mesh(
      new THREE.SphereGeometry(RADIO_LUNA, 48, 32),
      new THREE.MeshStandardMaterial({ color: proyecto.color, roughness: 0.5, metalness: 0.02 }),
    );
    luna.position.set(1.6, 0, 0);
    pivoteLuna.add(luna);

    const haloLuna = new THREE.Mesh(
      new THREE.SphereGeometry(RADIO_LUNA * 1.9, 32, 24),
      glowMaterial(proyecto.color, 0),
    );
    luna.add(haloLuna);

    return {
      datos,
      ancla,
      planeta,
      halo,
      pivoteLuna,
      luna,
      haloLuna,
      haloActual: 0,
      haloLunaActual: 0,
    };
  });

  const posEstrella = new THREE.Vector3(0, -1.7, 0);
  const posPlaneta = new THREE.Vector3();
  const posLuna = new THREE.Vector3();
  const mundo = new THREE.Vector3();

  let modo = "system";
  let seleccion = 0;
  let angulo = BAHIA;
  let objetivo = null;
  let proyectoActivo = false;

  return {
    setMode(nuevo) {
      modo = nuevo;
      if (nuevo === "system") objetivo = null;
    },
    setSelection(indice) {
      seleccion = indice;
      objetivo = indice >= 0 ? BAHIA - base[indice] : null;
    },
    setProject(activo) {
      proyectoActivo = activo;
    },
    labels() {
      const mundoActual = mundos[Math.max(0, seleccion)];
      mundoActual.ancla.getWorldPosition(mundo);
      posPlaneta.copy(mundo).add(new THREE.Vector3(RADIO_PLANETA + 0.85, 0.1, 0));
      mundoActual.luna.getWorldPosition(mundo);
      posLuna.copy(mundo).add(new THREE.Vector3(0, RADIO_LUNA + 0.35, 0));
      return { star: posEstrella, planet: posPlaneta, satellite: posLuna };
    },
    update(dt, elapsed, camera) {
      const pulso = 1 + Math.sin(elapsed * 0.9) * 0.015;
      estrella.scale.setScalar(pulso);
      corona.material.uniforms.uIntensity.value = 0.85 + Math.sin(elapsed * 0.7) * 0.06;
      aureola.quaternion.copy(camera.quaternion);

      if (modo === "system") {
        angulo += dt * VELOCIDAD;
      } else if (objetivo !== null) {
        const diferencia = Math.atan2(
          Math.sin(objetivo - angulo),
          Math.cos(objetivo - angulo),
        );
        angulo += diferencia * Math.min(1, dt * 3.2);
      }
      pivote.rotation.y = angulo;

      mundos.forEach((mundoActual, i) => {
        mundoActual.planeta.rotation.y += dt * 0.1;
        mundoActual.pivoteLuna.rotation.y +=
          dt * (proyectoActivo && i === seleccion ? 0.15 : 0.4);

        const haloObjetivo = modo !== "system" && i === seleccion ? 0.6 : 0;
        const haloLunaObjetivo = proyectoActivo && i === seleccion ? 0.95 : 0;
        mundoActual.haloActual += (haloObjetivo - mundoActual.haloActual) * Math.min(1, dt * 5);
        mundoActual.haloLunaActual +=
          (haloLunaObjetivo - mundoActual.haloLunaActual) * Math.min(1, dt * 5);
        mundoActual.halo.material.uniforms.uIntensity.value = mundoActual.haloActual;
        mundoActual.haloLuna.material.uniforms.uIntensity.value = mundoActual.haloLunaActual;
      });

      luz.intensity = 150 + Math.sin(elapsed * 0.6) * 8;
    },
  };
}

/** Línea de órbita fina y discreta. */
function crearOrbita(radio, color, opacidad) {
  const puntos = [];
  for (let i = 0; i <= 220; i += 1) {
    const a = (i / 220) * Math.PI * 2;
    puntos.push(new THREE.Vector3(Math.cos(a) * radio, 0, Math.sin(a) * radio));
  }
  const geometria = new THREE.BufferGeometry().setFromPoints(puntos);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: opacidad,
    depthWrite: false,
  });
  return new THREE.Line(geometria, material);
}
