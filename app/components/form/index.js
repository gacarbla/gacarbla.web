import { collectFrom, component } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
export const Form = component("x-form", import.meta.url, {
    setup({ shadow, host, attr, onCleanup }) {
        const form = shadow.querySelector("form");
        const boton = shadow.querySelector("button");
        if (!form || !boton)
            return;
        const clave = host.getAttribute("data-i18n-enviar");
        if (clave)
            boton.setAttribute("data-i18n", clave);
        else
            boton.textContent = attr("enviar") ?? "Enviar";
        onCleanup(i18n.apply(shadow));
        const onSubmit = (e) => {
            e.preventDefault();
            const data = collectFrom(form);
            const lineas = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
            const href = `mailto:${attr("para") ?? ""}?subject=${encodeURIComponent(attr("asunto") ?? "")}&body=${encodeURIComponent(lineas.join("\n"))}`;
            location.href = href;
        };
        form.addEventListener("submit", onSubmit);
        onCleanup(() => form.removeEventListener("submit", onSubmit));
    },
});
