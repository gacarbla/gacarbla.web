import { component, routeEvent, type SetupCtx } from "../../lib/rtw/index.js";

/**
 * Botón-enlace: con href pinta <a>, sin href <button> accesible.
 * Con data-go navega por SPA (href queda de fallback).
 * Link-button: <a> with href, accessible <button> without.
 * With data-go it navigates via SPA (href stays as fallback).
 *
 * Uso / Usage:
 *   <x-btn href="/experiencia" data-go="experiencia" variant="ghost">Texto</x-btn>
 *   <x-btn id="x">Texto</x-btn> (botón suelto / plain button)
 */
export const Btn = component("x-btn", import.meta.url, {
  attrs: ["href", "variant"],
  setup({ shadow, host, attr, onCleanup }: SetupCtx) {
    const variant = attr("variant") ?? "";
    const href = attr("href");
    const anchor = shadow.querySelector("a");
    if (!anchor) return;
    anchor.className = variant ? `btn ${variant}` : "btn";
    if (href) {
      anchor.setAttribute("href", href);
    } else {
      anchor.removeAttribute("href");
      anchor.setAttribute("role", "button");
      anchor.setAttribute("tabindex", "0");
      const onKey = (e: KeyboardEvent): void => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          anchor.click();
        }
      };
      anchor.addEventListener("keydown", onKey);
      onCleanup(() => anchor.removeEventListener("keydown", onKey));
    }
    /**
     * Clic SPA: data-go via evento compuesto (el <a> vive en sombra).
     * SPA click: data-go via composed event (the <a> lives in shadow).
     */
    const onClick = (e: MouseEvent): void => {
      const go = host.getAttribute("data-go");
      if (!go) return;
      e.preventDefault();
      host.dispatchEvent(routeEvent(go));
    };
    anchor.addEventListener("click", onClick);
    onCleanup(() => anchor.removeEventListener("click", onClick));
  },
});
