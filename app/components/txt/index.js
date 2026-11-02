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
function cambiaMultilinea(control, multilinea) {
    if (!multilinea)
        return control;
    if (control?.tagName !== "INPUT")
        return control;
    const input = control;
    const area = document.createElement("textarea");
    area.name = input.name;
    if (input.placeholder)
        area.placeholder = input.placeholder;
    if (input.required)
        area.required = true;
    input.replaceWith(area);
    return area;
}
function aplicaControl(control, nombre, tipo, placeholder, requerido, onCleanup) {
    if (!control)
        return;
    const input = control;
    if (nombre) {
        input.name = nombre;
        onCleanup(provideValue(nombre, () => input.value));
    }
    if (tipo && input instanceof HTMLInputElement)
        input.type = tipo;
    if (placeholder)
        input.placeholder = placeholder;
    input.required = requerido;
}
export const Txt = component("x-txt", import.meta.url, {
    setup({ shadow, host, attr, onCleanup }) {
        pintaEtiqueta(shadow.querySelector(".etiq"), host, attr("etiqueta"), attr("nombre") ?? "");
        const label = shadow.querySelector("label");
        const base = label?.querySelector("input, textarea");
        const control = cambiaMultilinea(base, attr("multilinea") !== null);
        aplicaControl(control, attr("nombre") ?? "", attr("tipo"), attr("placeholder"), attr("requerido") !== null, onCleanup);
        onCleanup(i18n.apply(shadow));
    },
});
