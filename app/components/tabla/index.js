import { component } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
export const Tabla = component("x-tabla", import.meta.url, {
    setup({ shadow, host, attr, onCleanup }) {
        const table = shadow.querySelector("table");
        if (!table)
            return;
        const traducir = host.hasAttribute("traducir");
        const pintar = () => {
            const t = (s) => (traducir ? i18n.t(s) : s);
            const columnas = leerLista(attr("columnas"), "columnas");
            const filas = leerFilas(attr("filas"));
            table.innerHTML = "";
            const head = document.createElement("tr");
            for (const c of columnas) {
                const th = document.createElement("th");
                th.textContent = t(c);
                head.appendChild(th);
            }
            const thead = document.createElement("thead");
            thead.appendChild(head);
            table.appendChild(thead);
            const body = document.createElement("tbody");
            for (const fila of filas) {
                const tr = document.createElement("tr");
                for (const celda of fila) {
                    const td = document.createElement("td");
                    td.textContent = t(celda);
                    tr.appendChild(td);
                }
                body.appendChild(tr);
            }
            table.appendChild(body);
        };
        pintar();
        onCleanup(i18n.onLang(pintar));
    },
});
function leerLista(raw, cual) {
    if (!raw)
        return [];
    try {
        const v = JSON.parse(raw);
        if (Array.isArray(v) && v.every((x) => typeof x === "string"))
            return v;
    }
    catch {
    }
    console.error(`[x-tabla] ${cual} no es JSON válido / invalid JSON ${cual}`);
    return [];
}
function leerFilas(raw) {
    if (!raw)
        return [];
    try {
        const v = JSON.parse(raw);
        if (Array.isArray(v)) {
            return v.filter((f) => Array.isArray(f) && f.every((x) => typeof x === "string"));
        }
    }
    catch {
    }
    console.error("[x-tabla] filas no es JSON válido / invalid JSON filas");
    return [];
}
