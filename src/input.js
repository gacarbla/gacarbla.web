/**
 * Controles: botón izquierdo rota, botón derecho desplaza, rueda o pellizco
 * acerca. Un clic izquierdo sin arrastre selecciona un cuerpo.
 */
export function initControls({ onRotate, onPan, onZoom, onClick }) {
  const canvas = document.querySelector("#scene");
  if (!canvas) return;

  const punteros = new Map();
  let boton = -1;
  let arrastrando = false;
  let recorrido = 0;
  let ultimoX = 0;
  let ultimoY = 0;
  let inicio = 0;
  let pinza = 0;

  const distanciaPinza = () => {
    const [a, b] = [...punteros.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  canvas.addEventListener("contextmenu", (evento) => evento.preventDefault());

  canvas.addEventListener("pointerdown", (evento) => {
    if (evento.button !== 0 && evento.button !== 2) return;
    canvas.setPointerCapture(evento.pointerId);
    punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });

    if (punteros.size === 1) {
      boton = evento.button;
      arrastrando = true;
      recorrido = 0;
      ultimoX = evento.clientX;
      ultimoY = evento.clientY;
      inicio = performance.now();
      canvas.classList.add("is-dragging");
    } else if (punteros.size === 2) {
      arrastrando = false;
      pinza = distanciaPinza();
    }
  });

  canvas.addEventListener("pointermove", (evento) => {
    if (!punteros.has(evento.pointerId)) return;
    const anterior = punteros.get(evento.pointerId);
    punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });

    if (punteros.size === 1 && arrastrando) {
      const dx = evento.clientX - anterior.x;
      const dy = evento.clientY - anterior.y;
      recorrido += Math.abs(dx) + Math.abs(dy);
      if (recorrido > 3) {
        if (boton === 2) onPan(dx, dy);
        else onRotate(dx, dy);
      }
      ultimoX = evento.clientX;
      ultimoY = evento.clientY;
    } else if (punteros.size === 2) {
      const actual = distanciaPinza();
      if (pinza > 0) onZoom(pinza - actual);
      pinza = actual;
    }
  });

  const soltar = (evento) => {
    if (!punteros.has(evento.pointerId)) return;
    const fueClic =
      punteros.size === 1 &&
      boton === 0 &&
      recorrido < 6 &&
      performance.now() - inicio < 450;

    punteros.delete(evento.pointerId);
    pinza = 0;

    if (punteros.size === 0) {
      arrastrando = false;
      boton = -1;
      canvas.classList.remove("is-dragging");
      if (fueClic) onClick(ultimoX, ultimoY);
    }
  };

  canvas.addEventListener("pointerup", soltar);
  canvas.addEventListener("pointercancel", soltar);

  window.addEventListener(
    "wheel",
    (evento) => {
      evento.preventDefault();
      onZoom(evento.deltaY);
    },
    { passive: false },
  );
}
