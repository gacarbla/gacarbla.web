import { component } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { alternarPantalla, vigilarPantalla } from "../../lib/pantalla.js";
function leeAttr(host, attr, nombre, defecto) {
    if (attr) {
        const v = attr(nombre);
        if (v !== null)
            return v.toLowerCase();
    }
    return (host.getAttribute(nombre) ?? defecto).toLowerCase();
}
function resolverObjetivo(host, selector) {
    if (!selector)
        return null;
    const raiz = host.getRootNode();
    if (!(raiz instanceof ShadowRoot) && !(raiz instanceof Document))
        return null;
    return raiz.querySelector(selector);
}
function disponiblePara(el) {
    return (!!el &&
        typeof el.requestFullscreen === "function" &&
        (typeof document === "undefined" || document.fullscreenEnabled !== false));
}
function esCampoTexto(t) {
    return t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
}
export const Pantalla = component("x-pantalla", import.meta.url, {
    attrs: ["para", "tecla"],
    setup({ shadow, host, attr, onCleanup }) {
        const stopI18n = i18n.apply(shadow);
        onCleanup(stopI18n);
        const boton = shadow.querySelector("button");
        const etiqueta = shadow.querySelector("[data-ref=etiqueta]");
        if (!boton)
            return;
        const objetivo = resolverObjetivo(host, leeAttr(host, attr, "para", ""));
        if (!disponiblePara(objetivo)) {
            host.setAttribute("hidden", "");
            return;
        }
        const tecla = leeAttr(host, attr, "tecla", "f");
        boton.setAttribute("aria-keyshortcuts", tecla);
        const aPantalla = () => alternarPantalla(objetivo);
        const quiereAlternar = (e) => {
            if (e.isComposing || e.key.toLowerCase() !== tecla)
                return false;
            return !esCampoTexto(e.target);
        };
        const alTeclado = (e) => {
            if (!quiereAlternar(e))
                return;
            e.preventDefault();
            alternarPantalla(objetivo);
        };
        const stopPantalla = vigilarPantalla(objetivo, (dentro) => {
            etiqueta?.setAttribute("data-i18n", dentro ? "games.salir_completa" : "games.completa");
            boton.toggleAttribute("data-dentro", dentro);
            boton.setAttribute("aria-pressed", String(dentro));
            i18n.paint(shadow);
        });
        boton.addEventListener("click", aPantalla);
        window.addEventListener("keydown", alTeclado);
        onCleanup(() => {
            boton.removeEventListener("click", aPantalla);
            window.removeEventListener("keydown", alTeclado);
            stopPantalla();
        });
    },
});
