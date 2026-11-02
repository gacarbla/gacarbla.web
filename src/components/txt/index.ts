import { component, provideValue, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";

/**
 * Pinta la etiqueta del campo: clave i18n o texto literal.
 * Paints the field label: i18n key or literal text.
 * @param etiq - Span de etiqueta o null. / Label span or null.
 * @param host - Elemento anfitrión (lee data-i18n-etiqueta). / Host element (reads data-i18n-etiqueta).
 * @param etiqueta - Texto literal del attr etiqueta. / Literal text from the etiqueta attr.
 * @param nombre - Nombre del campo (respaldo). / Field name (fallback).
 */
function pintaEtiqueta(etiq: Element | null, host: Element, etiqueta: string | null, nombre: string): void {
  if (!etiq) return;
  const clave = host.getAttribute("data-i18n-etiqueta");
  if (clave) etiq.setAttribute("data-i18n", clave);
  else etiq.textContent = etiqueta ?? nombre;
}

/**
 * Cambia el <input> por <textarea> cuando hay multilinea, copiando estado.
 * Swaps the <input> for a <textarea> when multilinea is set, copying state.
 * @param control - Control actual o null. / Current control or null.
 * @param multilinea - Si el attr multilinea está presente. / Whether the multilinea attr is present.
 * @returns El control definitivo. / The final control.
 */
function cambiaMultilinea(
  control: HTMLInputElement | HTMLTextAreaElement | null,
  multilinea: boolean,
): HTMLInputElement | HTMLTextAreaElement | null {
  if (!multilinea) return control;
  if (control?.tagName !== "INPUT") return control;
  const input = control as HTMLInputElement;
  const area = document.createElement("textarea");
  area.name = input.name;
  if (input.placeholder) area.placeholder = input.placeholder;
  if (input.required) area.required = true;
  input.replaceWith(area);
  return area;
}

/**
 * Aplica nombre, tipo, placeholder y requerido al control y aporta su valor.
 * Applies name, type, placeholder and required to the control and contributes its value.
 * @param control - Control definitivo o null. / Final control or null.
 * @param nombre - Nombre del campo. / Field name.
 * @param tipo - Tipo del input o null. / Input type or null.
 * @param placeholder - Placeholder o null. / Placeholder or null.
 * @param requerido - Si el attr requerido está presente. / Whether the requerido attr is present.
 * @param onCleanup - Registra el valor en x-form. / Registers the value with x-form.
 */
function aplicaControl(
  control: HTMLInputElement | HTMLTextAreaElement | null,
  nombre: string,
  tipo: string | null,
  placeholder: string | null,
  requerido: boolean,
  onCleanup: (fn: () => void) => void,
): void {
  if (!control) return;
  const input = control as HTMLInputElement;
  if (nombre) {
    input.name = nombre;
    onCleanup(provideValue(nombre, () => input.value));
  }
  if (tipo && input instanceof HTMLInputElement) input.type = tipo;
  if (placeholder) input.placeholder = placeholder;
  input.required = requerido;
}

/**
 * Campo de texto (o área con multilinea). Etiqueta traducible con
 * data-i18n-etiqueta="clave". Aporta su valor al x-form.
 * Text field (or area with multilinea). Translatable label via
 * data-i18n-etiqueta="key". Contributes its value to x-form.
 *
 * Uso / Usage:
 *   <x-txt etiqueta="Nombre" nombre="nombre" tipo="text"></x-txt>
 *   <x-txt etiqueta="Mensaje" nombre="mensaje" multilinea></x-txt>
 */
export const Txt = component("x-txt", import.meta.url, {
  setup({ shadow, host, attr, onCleanup }: SetupCtx) {
    pintaEtiqueta(shadow.querySelector(".etiq"), host, attr("etiqueta"), attr("nombre") ?? "");
    const label = shadow.querySelector("label");
    const base = label?.querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement | null;
    const control = cambiaMultilinea(base, attr("multilinea") !== null);
    aplicaControl(control, attr("nombre") ?? "", attr("tipo"), attr("placeholder"), attr("requerido") !== null, onCleanup);
    onCleanup(i18n.apply(shadow));
  },
});
