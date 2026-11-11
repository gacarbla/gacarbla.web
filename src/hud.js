/**
 * HUD: barra de etapas, panel del proyecto y pista de gesto.
 * Todo se actualiza por atributos y clases; nada se monta ni se desmonta.
 */
export function initHud() {
  const pasos = [...document.querySelectorAll("[data-stage-go]")];
  const pista = document.querySelector(".hint");
  const detalle = document.querySelector(".project-detail");

  return {
    setStage(index) {
      document.body.dataset.stage = String(index);

      pasos.forEach((paso) => {
        const activo = Number(paso.dataset.stageGo) === index;
        paso.classList.toggle("is-active", activo);
        if (activo) paso.setAttribute("aria-current", "step");
        else paso.removeAttribute("aria-current");
      });

      if (pista) pista.classList.toggle("is-up", index === 2);
      if (detalle) detalle.toggleAttribute("inert", index !== 2);
    },
  };
}
