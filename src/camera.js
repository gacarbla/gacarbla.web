import * as THREE from "three";

/**
 * Cámara orbital manual: arrastre para girar, rueda o pellizco para acercar.
 * El objetivo sigue al planeta seleccionado; el usuario manda en el ángulo
 * y la distancia.
 */
export function createOrbitCamera(camera, { systemRadius, focusRadius, phi = 1.27 }) {
  const estado = {
    theta: 0,
    phi,
    radio: systemRadius,
    target: new THREE.Vector3(),
    desTheta: 0,
    desPhi: phi,
    desRadio: systemRadius,
    desTarget: new THREE.Vector3(),
  };

  const pan = new THREE.Vector3();
  const direccion = new THREE.Vector3();
  const derecha = new THREE.Vector3();
  const arriba = new THREE.Vector3();

  const MIN_RADIO = 5;
  const MAX_RADIO = 70;

  /**
   * @param {number} dt
   * @param {THREE.Vector3 | null} foco - Posición del planeta seleccionado.
   */
  function update(dt, foco) {
    if (foco) estado.desTarget.copy(foco).add(pan);
    else estado.desTarget.copy(pan);

    const k = 1 - Math.exp(-dt * 9);
    estado.target.lerp(estado.desTarget, k);
    estado.theta += (estado.desTheta - estado.theta) * k;
    estado.phi += (estado.desPhi - estado.phi) * k;
    estado.radio += (estado.desRadio - estado.radio) * k;

    const seno = Math.sin(estado.phi);
    camera.position.set(
      estado.target.x + estado.radio * seno * Math.sin(estado.theta),
      estado.target.y + estado.radio * Math.cos(estado.phi),
      estado.target.z + estado.radio * seno * Math.cos(estado.theta),
    );
    camera.lookAt(estado.target);
  }

  return {
    update,
    /** Botón izquierdo: rotar alrededor del objetivo. */
    rotate(dx, dy) {
      estado.desTheta -= dx * 0.005;
      estado.desPhi = Math.min(1.45, Math.max(0.3, estado.desPhi - dy * 0.005));
    },
    /** Botón derecho: desplazar el objetivo por el espacio. */
    pan(dx, dy) {
      direccion.copy(estado.target).sub(camera.position).normalize();
      derecha.crossVectors(direccion, camera.up).normalize();
      arriba.crossVectors(derecha, direccion).normalize();
      const factor = estado.radio * 0.0016;
      pan.addScaledVector(derecha, -dx * factor).addScaledVector(arriba, dy * factor);
    },
    zoom(delta) {
      const factor = Math.exp(delta * 0.0011);
      estado.desRadio = Math.min(MAX_RADIO, Math.max(MIN_RADIO, estado.desRadio * factor));
    },
    setFocus(activo) {
      estado.desRadio = activo ? focusRadius : systemRadius;
      pan.set(0, 0, 0);
    },
    get radio() {
      return estado.desRadio;
    },
  };
}
