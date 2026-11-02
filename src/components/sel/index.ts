import { component, provideValue, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";

/** Opción: texto o [valor, texto]. / Option: text or [value, text]. */
type Opcion = string | [string, string];

/**
 * Pinta la etiqueta del desplegable: clave i18n o texto literal.
 * Paints the dropdown label: i18n key or literal text.
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
 * Crea una <option> desde texto o [valor, texto] (traduce si se pide).
 * Creates an <option> from text or [value, text] (translates when asked).
 * @param op - Opción cruda. / Raw option.
 * @param traducir - Si las cadenas son claves i18n. / Whether strings are i18n keys.
 * @returns La opción lista. / The ready option.
 */
function creaOpcion(op: Opcion, traducir: boolean): HTMLOptionElement {
  const opt = document.createElement("option");
  if (typeof op === "string") {
    opt.value = op;
    opt.textContent = traducir ? i18n.t(op) : op;
  } else {
    opt.value = op[0];
    opt.textContent = op[1];
  }
  return opt;
}

/**
 * Rellena opciones conservando la selección (sobrevive al idioma).
 * Fills options preserving selection (survives language switch).
 * @param select - Desplegable destino. / Target dropdown.
 * @param ops - Opciones ya leídas. / Already parsed options.
 * @param traducir - Si las cadenas son claves i18n. / Whether strings are i18n keys.
 */
function rellenaOpciones(select: HTMLSelectElement, ops: Opcion[], traducir: boolean): void {
  const previo = select.value;
  select.innerHTML = "";
  for (const op of ops) select.appendChild(creaOpcion(op, traducir));
  if ([...select.options].some((o) => o.value === previo)) select.value = previo;
}

/**
 * Desplegable. Etiqueta traducible con data-i18n-etiqueta.
 * Con `traducir`, las opciones son claves i18n. Aporta su valor al x-form.
 * Dropdown. Translatable label via data-i18n-etiqueta.
 * With `traducir`, options are i18n keys. Contributes its value to x-form.
 *
 * Uso / Usage:
 *   <x-sel etiqueta="Motivo" nombre="motivo" opciones='["Consulta","Oferta"]'></x-sel>
 */
export const Sel = component("x-sel", import.meta.url, {
  setup({ shadow, host, attr, onCleanup }: SetupCtx) {
    pintaEtiqueta(shadow.querySelector(".etiq"), host, attr("etiqueta"), attr("nombre") ?? "");
    const select = shadow.querySelector("select");
    if (!select) {
      onCleanup(i18n.apply(shadow));
      return;
    }
    const nombre = attr("nombre") ?? "";
    if (nombre) select.name = nombre;
    const traducir = host.hasAttribute("traducir");
    const rellenar = (): void => rellenaOpciones(select, leerOpciones(attr("opciones")), traducir);
    rellenar();
    if (nombre) onCleanup(provideValue(nombre, () => select.value));
    onCleanup(i18n.onLang(rellenar));
    onCleanup(i18n.apply(shadow));
  },
});

/**
 * Lee el JSON de opciones con red de seguridad.
 * Reads the options JSON with a safety net.
 * @param raw - Attr crudo o null. / Raw attr or null.
 * @returns Lista válida (vacía si falla). / Valid list (empty on failure).
 */
function leerOpciones(raw: string | null): Opcion[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((o): o is Opcion => typeof o === "string" || (Array.isArray(o) && o.length === 2));
  } catch {
    console.error("[x-sel] opciones no es JSON válido / invalid JSON opciones");
    return [];
  }
}
