/**
 * Pantalla completa al estilo YouTube: un elemento pide la pantalla y
 * el navegador oculta el resto (layout incluido). Sin dependencias.
 * YouTube-style fullscreen: one element takes the screen and the
 * browser hides the rest (layout included). Zero dependencies.
 */

/**
 * ¿Ese elemento tiene la pantalla? / Does that element hold the screen?
 * @param el - Elemento candidato. / Candidate element.
 */
export function enPantalla(el: Element): boolean {
  return document.fullscreenElement === el;
}

/**
 * Entra o sale de pantalla completa para ese elemento. Si ya hay OTRA
 * pantalla activa, primero se sale de ella (el usuario repite el gesto
 * para entrar). Nunca deja dos pantallas encadenadas.
 * Enters or exits fullscreen for that element. When ANOTHER screen is
 * active it exits first (the user repeats the gesture to enter).
 * Never stacks two screens.
 * @param el - Elemento a mostrar. / Element to show.
 */
export function alternarPantalla(el: Element): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {
      /* salir es opcional / exiting is optional */
    });
    return;
  }
  const pedir = (el as HTMLElement).requestFullscreen?.bind(el);
  if (pedir) {
    void pedir().catch(() => {
      /* entrar puede denegarse / entering may be denied */
    });
  }
}

/**
 * Avisa cuando ese elemento entra o sale de la pantalla.
 * Notifies when that element enters or leaves the screen.
 * @param el - Elemento vigilado. / Watched element.
 * @param alCambiar - Oyente con el estado. / Listener with the state.
 * @returns Desuscriptor. / Unsubscriber.
 */
export function vigilarPantalla(el: Element, alCambiar: (dentro: boolean) => void): () => void {
  const fn = (): void => alCambiar(document.fullscreenElement === el);
  document.addEventListener("fullscreenchange", fn);
  return () => document.removeEventListener("fullscreenchange", fn);
}
