import { component, routeEvent, type SetupCtx } from "../../lib/rtw/index.js";

/**
 * Pie con año automático y autor por atributo `nombre`. Esconde la puerta
 * del misterio: la palabra "seek" del pie abre /archivo.
 * Footer with automatic year and `nombre`-attribute author. Hides the
 * mystery door: the footer word "seek" opens /archivo.
 *
 * Uso en cualquier layout / Usage in any layout:
 *   import { Footer } from "../../components/footer/index.js";
 *   <x-footer></x-footer>  (atributo nombre="..." para cambiar el autor / nombre="..." attr changes the author)
 */
export const Footer = component("x-footer", import.meta.url, {
  attrs: ["nombre"],
  setup({ shadow, attr, onCleanup }: SetupCtx) {
    const anio = shadow.querySelector(".anio");
    if (anio) anio.textContent = String(new Date().getFullYear());
    const nombre = attr("nombre");
    if (nombre) {
      const autor = shadow.querySelector(".autor");
      if (autor) autor.textContent = nombre;
    }
    /**
     * La puerta del misterio navega por SPA (el enlace vive en sombra).
     * The mystery door navigates through the SPA (link lives in shadow).
     */
    const seek = shadow.querySelector(".seek");
    const onSeek = (e: Event): void => {
      e.preventDefault();
      seek?.dispatchEvent(routeEvent("archivo"));
    };
    seek?.addEventListener("click", onSeek);
    onCleanup(() => seek?.removeEventListener("click", onSeek));
  },
});
