import { component, provideValue } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
function pintaEtiqueta(etiq, host, etiqueta, nombre) {
    if (!etiq)
        return;
    const clave = host.getAttribute("data-i18n-etiqueta");
    if (clave)
        etiq.setAttribute("data-i18n", clave);
    else
        etiq.textContent = etiqueta ?? nombre;
}
function creaOpcion(op, traducir) {
    const opt = document.createElement("option");
    if (typeof op === "string") {
        opt.value = op;
        opt.textContent = traducir ? i18n.t(op) : op;
    }
    else {
        opt.value = op[0];
        opt.textContent = op[1];
    }
    return opt;
}
function rellenaOpciones(select, ops, traducir) {
    const previo = select.value;
    select.innerHTML = "";
    for (const op of ops)
        select.appendChild(creaOpcion(op, traducir));
    if ([...select.options].some((o) => o.value === previo))
        select.value = previo;
}
export const Sel = component("x-sel", import.meta.url, {
    setup({ shadow, host, attr, onCleanup }) {
        pintaEtiqueta(shadow.querySelector(".etiq"), host, attr("etiqueta"), attr("nombre") ?? "");
        const select = shadow.querySelector("select");
        if (!select) {
            onCleanup(i18n.apply(shadow));
            return;
        }
        const nombre = attr("nombre") ?? "";
        if (nombre)
            select.name = nombre;
        const traducir = host.hasAttribute("traducir");
        const rellenar = () => rellenaOpciones(select, leerOpciones(attr("opciones")), traducir);
        rellenar();
        if (nombre)
            onCleanup(provideValue(nombre, () => select.value));
        onCleanup(i18n.onLang(rellenar));
        onCleanup(i18n.apply(shadow));
    },
});
function leerOpciones(raw) {
    if (!raw)
        return [];
    try {
        const v = JSON.parse(raw);
        if (!Array.isArray(v))
            return [];
        return v.filter((o) => typeof o === "string" || (Array.isArray(o) && o.length === 2));
    }
    catch {
        console.error("[x-sel] opciones no es JSON válido / invalid JSON opciones");
        return [];
    }
}
