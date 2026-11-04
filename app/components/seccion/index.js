import { component } from "../../lib/rtw/index.js";
import { seccion } from "../../lib/archivo.js";
export const Seccion = component("x-seccion", import.meta.url, {
    attrs: ["data-seccion"],
    setup({ shadow, attr }) {
        const id = attr("data-seccion") ?? "";
        const s = seccion(id);
        if (!s)
            return;
        const titulo = shadow.querySelector('[data-ref="titulo"]');
        const texto = shadow.querySelector('[data-ref="texto"]');
        if (titulo)
            titulo.textContent = s.titulo;
        if (texto)
            texto.textContent = s.texto;
    },
});
