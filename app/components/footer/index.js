import { component } from "../../lib/rtw/index.js";
export const Footer = component("x-footer", import.meta.url, {
    attrs: ["nombre"],
    setup({ shadow, attr }) {
        const anio = shadow.querySelector(".anio");
        if (anio)
            anio.textContent = String(new Date().getFullYear());
        const nombre = attr("nombre");
        if (nombre) {
            const autor = shadow.querySelector(".autor");
            if (autor)
                autor.textContent = nombre;
        }
    },
});
