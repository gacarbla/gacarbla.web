import * as THREE from "three";
import { glowMaterial, starMaterial, haloMaterial } from "./materials.js";

const RADIO_ORBITA = 4.8;
const RADIO_PLANETA = 0.92;
const RADIO_LUNA = 0.26;
const ANGULO_BAHIA = 0.6;
const VELOCIDAD_ORBITA = 0.1;

/**
 * Sistema orbital: una estrella central (GACARBLA), un planeta personal
 * y una luna para el portfolio. Todo con colores sólidos y luz real.
 */
export function createSystem({ scene, quality }) {
  const grupo = new THREE.Group();
  scene.add(grupo);

  // Estrella
  const estrella = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 64, 48),
    starMaterial(),
  );
  grupo.add(estrella);

  const corona = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 48), glowMaterial("#ffb066", 0.9));
  const aureola = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), haloMaterial("#ff9a4d", 0.42));
  aureola.renderOrder = -1;
  grupo.add(corona, aureola);

  const luz = new THREE.PointLight(0xffd7a1, 150, 0, 2);
  grupo.add(luz);
  const ambiente = new THREE.AmbientLight(0x2f4f8a, 2.0);
  grupo.add(ambiente);

  // Plano orbital del planeta
  const plano = new THREE.Group();
  plano.rotation.x = 0.16;
  grupo.add(plano);

  const orbitaPlaneta = crearOrbita(RADIO_ORBITA, "#6f8fff", 0.16);
  plano.add(orbitaPlaneta);

  const pivote = new THREE.Group();
  plano.add(pivote);

  const ancla = new THREE.Group();
  ancla.position.set(RADIO_ORBITA, 0, 0);
  pivote.add(ancla);

  const planeta = new THREE.Mesh(
    new THREE.SphereGeometry(RADIO_PLANETA, 64, 48),
    new THREE.MeshStandardMaterial({ color: "#3f7bd9", roughness: 0.62, metalness: 0.02 }),
  );
  ancla.add(planeta);

  const haloPlaneta = new THREE.Mesh(
    new THREE.SphereGeometry(RADIO_PLANETA * 1.5, 48, 32),
    glowMaterial("#5aa0ff", 0),
  );
  ancla.add(haloPlaneta);

  // Luna del portfolio
  const planoLuna = new THREE.Group();
  planoLuna.rotation.x = 0.55;
  ancla.add(planoLuna);

  const orbitaLuna = crearOrbita(1.55, "#ffb86b", 0.18);
  planoLuna.add(orbitaLuna);

  const pivoteLuna = new THREE.Group();
  planoLuna.add(pivoteLuna);

  const luna = new THREE.Mesh(
    new THREE.SphereGeometry(RADIO_LUNA, 48, 32),
    new THREE.MeshStandardMaterial({ color: "#ffb86b", roughness: 0.5, metalness: 0.02 }),
  );
  luna.position.set(1.55, 0, 0);
  pivoteLuna.add(luna);

  const haloLuna = new THREE.Mesh(
    new THREE.SphereGeometry(RADIO_LUNA * 1.8, 32, 24),
    glowMaterial("#ffb86b", 0),
  );
  luna.add(haloLuna);

  const posEstrella = new THREE.Vector3(0, -1.75, 0);
  const posPlaneta = new THREE.Vector3();
  const posLuna = new THREE.Vector3();
  const mundo = new THREE.Vector3();

  let modo = "system";
  let angulo = 0.6;
  let haloPlanetaActual = 0;
  let haloLunaActual = 0;
  let proyectoActivo = false;

  return {
    setMode(nuevo) {
      modo = nuevo;
    },
    setProject(activo) {
      proyectoActivo = activo;
    },
    /** Posiciones de mundo para las etiquetas de la interfaz. */
    labels() {
      return { star: posEstrella, planet: posPlaneta, satellite: posLuna };
    },
    update(dt, elapsed, camera) {
      // La estrella respira muy despacio.
      const pulso = 1 + Math.sin(elapsed * 0.9) * 0.015;
      estrella.scale.setScalar(pulso);
      corona.material.uniforms.uIntensity.value = 0.85 + Math.sin(elapsed * 0.7) * 0.06;
      aureola.quaternion.copy(camera.quaternion);

      // El planeta gira sobre sí mismo sin cambiar de órbita.
      planeta.rotation.y += dt * 0.12;

      if (modo === "system") {
        angulo += dt * VELOCIDAD_ORBITA;
      } else {
        const diferencia = Math.atan2(
          Math.sin(ANGULO_BAHIA - angulo),
          Math.cos(ANGULO_BAHIA - angulo),
        );
        angulo += diferencia * Math.min(1, dt * 4.2);
      }
      pivote.rotation.y = angulo;

      // La luna orbita siempre; más despacio cuando es el foco.
      pivoteLuna.rotation.y += dt * (proyectoActivo ? 0.16 : 0.42);

      // Halos de selección.
      const objetivoPlaneta = modo === "system" ? 0 : 0.65;
      const objetivoLuna = modo === "project" ? 0.95 : 0;
      haloPlanetaActual += (objetivoPlaneta - haloPlanetaActual) * Math.min(1, dt * 5);
      haloLunaActual += (objetivoLuna - haloLunaActual) * Math.min(1, dt * 5);
      haloPlaneta.material.uniforms.uIntensity.value = haloPlanetaActual;
      haloLuna.material.uniforms.uIntensity.value = haloLunaActual;

      // Posiciones para las etiquetas.
      ancla.getWorldPosition(mundo);
      posPlaneta.copy(mundo).add(new THREE.Vector3(RADIO_PLANETA + 0.9, 0.15, 0));
      luna.getWorldPosition(mundo);
      posLuna.copy(mundo).add(new THREE.Vector3(0, RADIO_LUNA + 0.34, 0));

      // La luz respira con la estrella.
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
