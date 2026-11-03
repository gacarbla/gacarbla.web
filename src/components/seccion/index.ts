import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { seccion } from "../../lib/archivo.js";

/**
 * Sección secreta del archivo (linde, cauce). Se pinta desde los datos
 * sellados y no necesita lógica de juego.
 * Secret archive section (linde, cauce). Painted from the sealed data
 * and needs no game logic.
 *
 * Uso / Usage: <x-seccion data-seccion="linde"></x-seccion>.
 */
export const Seccion = component("x-seccion", import.meta.url, {
  attrs: ["data-seccion"],
  setup({ shadow, attr }: SetupCtx) {
    const id = attr("data-seccion") ?? "";
    const s = seccion(id);
    if (!s) return;
    const titulo = shadow.querySelector('[data-ref="titulo"]');
    const texto = shadow.querySelector('[data-ref="texto"]');
    if (titulo) titulo.textContent = s.titulo;
    if (texto) texto.textContent = s.texto;
  },
});
