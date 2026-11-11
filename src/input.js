/**
 * Navegación por gestos. No hay scroll real: el wheel y el swipe se
 * acumulan con tolerancia y disparan un único cambio de etapa.
 */
export function initInput({ next, prev, goTo, isLocked }) {
  const UMBRAL_RUEDA = 48;
  const UMBRAL_SWIPE = 42;
  const ESPERA = 170;

  let acumulado = 0;
  let temporizador = 0;
  let inicioY = null;

  const mover = (direccion) => {
    if (isLocked()) return;
    if (direccion > 0) next();
    else prev();
  };

  window.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (isLocked()) return;
      if (Math.abs(event.deltaY) < 1.5) return;

      acumulado += event.deltaY;
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(() => {
        acumulado = 0;
      }, ESPERA);

      if (Math.abs(acumulado) >= UMBRAL_RUEDA) {
        const direccion = Math.sign(acumulado);
        acumulado = 0;
        mover(direccion);
      }
    },
    { passive: false },
  );

  window.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      inicioY = event.touches[0].clientY;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length === 1) event.preventDefault();
    },
    { passive: false },
  );

  window.addEventListener(
    "touchend",
    (event) => {
      if (inicioY === null) return;
      const fin = event.changedTouches[0]?.clientY ?? inicioY;
      const delta = inicioY - fin;
      inicioY = null;
      if (Math.abs(delta) >= UMBRAL_SWIPE) mover(Math.sign(delta));
    },
    { passive: true },
  );

  window.addEventListener("keydown", (event) => {
    const tecla = event.key;
    if (tecla === "ArrowDown" || tecla === "ArrowRight" || tecla === "PageDown") {
      event.preventDefault();
      mover(1);
    } else if (tecla === "ArrowUp" || tecla === "ArrowLeft" || tecla === "PageUp") {
      event.preventDefault();
      mover(-1);
    } else if (tecla === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (tecla === "End") {
      event.preventDefault();
      goTo(2);
    }
  });

  // Los botones de la barra de etapas se enganchan desde la HUD.
  document.querySelectorAll("[data-stage-go]").forEach((boton) => {
    boton.addEventListener("click", () => goTo(Number(boton.dataset.stageGo)));
  });
}
