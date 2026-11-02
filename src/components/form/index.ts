import { collectFrom, component, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";

/**
 * Formulario sin backend: recoge los campos (x-txt, x-sel) y abre
 * el correo con todo redactado.
 * Backend-less form: gathers fields (x-txt, x-sel) and opens
 * the mail client with everything drafted.
 *
 * Uso / Usage:
 *   <x-form para="yo@dom.io" asunto="Hola" enviar="Enviar">
 *     <x-txt etiqueta="Nombre" nombre="nombre"></x-txt>
 *   </x-form>
 */
export const Form = component("x-form", import.meta.url, {
  setup({ shadow, host, attr, onCleanup }: SetupCtx) {
    const form = shadow.querySelector("form");
    const boton = shadow.querySelector("button");
    if (!form || !boton) return;
    const clave = host.getAttribute("data-i18n-enviar");
    if (clave) boton.setAttribute("data-i18n", clave);
    else boton.textContent = attr("enviar") ?? "Enviar";
    onCleanup(i18n.apply(shadow));
    /**
     * Al enviar: recolecta campos y compone el mailto.
     * On submit: collects fields and composes the mailto.
     */
    const onSubmit = (e: Event): void => {
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
