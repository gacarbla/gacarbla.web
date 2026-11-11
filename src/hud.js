/**
 * HUD: conecta la barra de etapas, el panel del planeta y la ficha del
 * proyecto. Todo se controla con atributos y clases; nada se desmonta.
 */
export function initHud({ onMode }) {
  const acciones = [...document.querySelectorAll("[data-mode-go]")];
  const pasos = [...document.querySelectorAll(".rail-step")];
  const proyectos = [...document.querySelectorAll("[data-project]")];
  const vistas = [...document.querySelectorAll("[data-panel]")];
  const panel = document.querySelector(".panel");
  const marco = document.querySelector(".panel-frame");
  let modo = "system";

  function ajustarAltura() {
    if (!marco) return;
    const objetivo = modo === "project" ? "project" : "planet";
    const vista = vistas.find((v) => v.dataset.panel === objetivo);
    if (vista) marco.style.height = `${vista.offsetHeight}px`;
  }

  for (const accion of acciones) {
    accion.addEventListener("click", () => onMode(accion.dataset.modeGo));
  }
  for (const proyecto of proyectos) {
    proyecto.addEventListener("click", () => onMode("project"));
  }
  window.addEventListener("resize", ajustarAltura);

  return {
    setMode(mode) {
      modo = mode;
      document.body.dataset.mode = mode;

      for (const paso of pasos) {
        const activo = paso.dataset.modeGo === mode;
        paso.classList.toggle("is-active", activo);
        if (activo) paso.setAttribute("aria-current", "step");
        else paso.removeAttribute("aria-current");
      }

      for (const vista of vistas) {
        vista.toggleAttribute("inert", vista.dataset.panel !== mode);
      }
      if (panel) panel.toggleAttribute("inert", mode === "system");

      requestAnimationFrame(ajustarAltura);
    },
  };
}
