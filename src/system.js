import * as THREE from "three";
import { glowMaterial, starMaterial, haloMaterial } from "./materials.js";
import { PLANETAS } from "./data.js";

const ANGULOS_INICIALES = [0.9, 2.6, 4.3, 5.5];

/**
 * Sistema orbital: una estrella central y un planeta por rama. Cada planeta
 * tiene su órbita, su tamaño, su giro y su traslación; sus proyectos son
 * satélites con órbitas propias.
 */
export function createSystem({ scene }) {
  const grupo = new THREE.Group();
  scene.add(grupo);

  // Estrella
  const estrella = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 48), starMaterial());
  grupo.add(estrella);

  const corona = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 48), glowMaterial("#ffb066", 0.9));
  const aureola = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 8.5), haloMaterial("#ff9a4d", 0.42));
  aureola.renderOrder = -1;
  grupo.add(corona, aureola);

  const luz = new THREE.PointLight(0xffd7a1, 170, 0, 2);
  grupo.add(luz);
  grupo.add(new THREE.AmbientLight(0x2f4f8a, 2.7));

  const mundos = PLANETAS.map((datos, i) => {
    const plano = new THREE.Group();
    plano.rotation.x = datos.inclinacion;
    grupo.add(plano);

    const orbita = crearOrbita(datos.orbita, datos.color, 0.13);
    plano.add(orbita);

    const pivote = new THREE.Group();
    plano.add(pivote);

    const ancla = new THREE.Group();
    ancla.position.set(datos.orbita, 0, 0);
    pivote.add(ancla);

    const planeta = new THREE.Mesh(
      new THREE.SphereGeometry(datos.tamano, 64, 48),
      new THREE.MeshStandardMaterial({ color: datos.color, roughness: 0.62, metalness: 0.02 }),
    );
    ancla.add(planeta);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(datos.tamano * 1.5, 48, 32),
      glowMaterial(datos.color, 0),
    );
    ancla.add(halo);

    const satelites = datos.proyectos.map((proyecto, j) => {
      const planoLuna = new THREE.Group();
      planoLuna.rotation.x = 0.3 + j * 0.7;
      planoLuna.rotation.z = j * 0.5;
      ancla.add(planoLuna);

      const radio = 0.7 + j * 0.28 + datos.tamano * 0.3;
      planoLuna.add(crearOrbita(radio, proyecto.color, 0.14));

      const pivoteLuna = new THREE.Group();
      planoLuna.add(pivoteLuna);

      const luna = new THREE.Mesh(
        new THREE.SphereGeometry(0.09 + j * 0.012, 32, 24),
        new THREE.MeshStandardMaterial({ color: proyecto.color, roughness: 0.5, metalness: 0.02 }),
      );
      luna.position.set(radio, 0, 0);
      pivoteLuna.add(luna);

      const haloLuna = new THREE.Mesh(
        new THREE.SphereGeometry((0.09 + j * 0.012) * 1.9, 24, 18),
        glowMaterial(proyecto.color, 0),
      );
      luna.add(haloLuna);

      return {
        proyecto,
        pivoteLuna,
        luna,
        haloLuna,
        haloActual: 0,
        velocidad: 0.45 + j * 0.2,
        angulo: j * 2.1,
      };
    });

    return {
      datos,
      plano,
      orbita,
      pivote,
      ancla,
      planeta,
      halo,
      satelites,
      haloActual: 0,
      orbitaActual: 0.13,
      angulo: ANGULOS_INICIALES[i] ?? i,
    };
  });

  const posEstrella = new THREE.Vector3(0, -1.7, 0);
  const posPlaneta = new THREE.Vector3();
  const posLuna = new THREE.Vector3();
  const mundo = new THREE.Vector3();

  let modo = "system";
  let seleccion = 0;
  let proyectoActivo = null;

  return {
    setMode(nuevo) {
      modo = nuevo;
    },
    setSelection(indice) {
      seleccion = indice;
    },
    setProject(id) {
      proyectoActivo = id;
    },
    planetPosition(indice, target = new THREE.Vector3()) {
      return mundos[indice].ancla.getWorldPosition(target);
    },
    labels() {
      const mundoActual = mundos[Math.max(0, seleccion)];
      mundoActual.ancla.getWorldPosition(mundo);
      posPlaneta.copy(mundo).add(
        new THREE.Vector3(mundoActual.datos.tamano + 0.65, 0.1, 0),
      );

      const satelite =
        mundoActual.satelites.find((s) => s.proyecto.id === proyectoActivo) ??
        mundoActual.satelites[0];
      satelite.luna.getWorldPosition(mundo);
      posLuna.copy(mundo).add(new THREE.Vector3(0, 0.3, 0));

      return { star: posEstrella, planet: posPlaneta, satellite: posLuna };
    },
    update(dt, elapsed, camera) {
      const pulso = 1 + Math.sin(elapsed * 0.9) * 0.015;
      estrella.scale.setScalar(pulso);
      corona.material.uniforms.uIntensity.value = 0.85 + Math.sin(elapsed * 0.7) * 0.06;
      aureola.quaternion.copy(camera.quaternion);

      mundos.forEach((mundoActual, i) => {
        const enfocado = modo !== "system" && i === seleccion;

        // Traslación continua: ningún planeta se detiene.
        mundoActual.angulo += dt * mundoActual.datos.traslacion;
        mundoActual.pivote.rotation.y = mundoActual.angulo;

        // Rotación propia y órbita resaltada.
        mundoActual.planeta.rotation.y += dt * mundoActual.datos.giro;
        const orbitaObjetivo = enfocado ? 0.42 : 0.13;
        mundoActual.orbitaActual +=
          (orbitaObjetivo - mundoActual.orbitaActual) * Math.min(1, dt * 4);
        mundoActual.orbita.material.opacity = mundoActual.orbitaActual;

        // Halo del planeta.
        const haloObjetivo = enfocado ? 0.6 : 0;
        mundoActual.haloActual +=
          (haloObjetivo - mundoActual.haloActual) * Math.min(1, dt * 5);
        mundoActual.halo.material.uniforms.uIntensity.value = mundoActual.haloActual;

        // Satélites: cada uno con su órbita y velocidad.
        mundoActual.satelites.forEach((satelite) => {
          const esFoco = i === seleccion && satelite.proyecto.id === proyectoActivo;
          satelite.pivoteLuna.rotation.y += dt * satelite.velocidad * (esFoco ? 0.35 : 1);
          const objetivo = esFoco ? 0.95 : 0;
          satelite.haloActual += (objetivo - satelite.haloActual) * Math.min(1, dt * 5);
          satelite.haloLuna.material.uniforms.uIntensity.value = satelite.haloActual;
        });
      });

      luz.intensity = 170 + Math.sin(elapsed * 0.6) * 9;
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
