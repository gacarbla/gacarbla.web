import { component, type SetupCtx } from "../../lib/rtw/index.js";

/**
 * Pie con año automático y autor por atributo `nombre`.
 * Footer with automatic year and `nombre` attribute author.
 *
 * Uso en cualquier layout / Usage in any layout:
 *   import { Footer } from "../../components/footer/index.js";
 *   <x-footer></x-footer>  (atributo nombre="..." para cambiar el autor / nombre="..." attr changes the author)
 */
export const Footer = component("x-footer", import.meta.url, {
  attrs: ["nombre"],
  setup({ shadow, attr }: SetupCtx) {
    const anio = shadow.querySelector(".anio");
    if (anio) anio.textContent = String(new Date().getFullYear());
    const nombre = attr("nombre");
    if (nombre) {
      const autor = shadow.querySelector(".autor");
      if (autor) autor.textContent = nombre;
    }
  },
});
