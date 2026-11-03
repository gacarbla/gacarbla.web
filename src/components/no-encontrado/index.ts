import { component, routeEvent, type SetupCtx } from "../../lib/rtw/index.js";

/**
 * Aviso 404 para las puertas que no se abren. No es una ruta: es lo que
 * ve el jugador cuando la palabra falta o no es la correcta.
 * 404 notice for doors that do not open. It is not a route: it is what
 * the player sees when the word is missing or wrong.
 *
 * Uso / Usage: <x-no-encontrado hidden></x-no-encontrado>.
 */
export const NoEncontrado = component("x-no-encontrado", import.meta.url, {
  setup({ shadow, onCleanup }: SetupCtx) {
    const volver = shadow.querySelector('[data-ref="volver"]');
    const onClick = (e: Event): void => {
      e.preventDefault();
      volver?.dispatchEvent(routeEvent("inicio"));
    };
    volver?.addEventListener("click", onClick);
    onCleanup(() => volver?.removeEventListener("click", onClick));
  },
});
