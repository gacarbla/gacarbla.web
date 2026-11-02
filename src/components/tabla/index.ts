import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";

/**
 * Tabla desde JSON: columnas + filas. Con `traducir`, cada texto es
 * una clave i18n (los literales ausentes se muestran tal cual).
 * Table from JSON: columns + rows. With `traducir`, each text is
 * an i18n key (missing ones show as-is).
 *
 * Uso / Usage:
 *   <x-tabla columnas='["A","B"]' filas='[["1","2"],["3","4"]]'></x-tabla>
 *   <x-tabla traducir columnas='["k.col1"]' filas='[["k.a"]]'></x-tabla>
 */
export const Tabla = component("x-tabla", import.meta.url, {
  setup({ shadow, host, attr, onCleanup }: SetupCtx) {
    const table = shadow.querySelector("table");
    if (!table) return;
    const traducir = host.hasAttribute("traducir");
    /**
     * Pinta la tabla resolviendo claves si toca. Reconstruir una tabla
     * no pierde foco ni valores: es seguro re-pintar al cambiar idioma.
     * Paints the table resolving keys when due. Rebuilding a table loses
     * no focus or values: repainting on language switch is safe.
     */
    const pintar = (): void => {
      const t = (s: string): string => (traducir ? i18n.t(s) : s);
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

/**
 * Lee una lista JSON de textos.
 * Reads a JSON list of texts.
 * @param raw - Attr crudo. / Raw attr.
 * @param cual - Nombre para el error. / Name for the error.
 * @returns Lista válida. / Valid list.
 */
function leerLista(raw: string | null, cual: string): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v) && v.every((x): x is string => typeof x === "string")) return v;
  } catch {
    /* cae al error / falls through to error */
  }
  console.error(`[x-tabla] ${cual} no es JSON válido / invalid JSON ${cual}`);
  return [];
}

/**
 * Lee filas JSON (listas de texto).
 * Reads JSON rows (text lists).
 * @param raw - Attr crudo. / Raw attr.
 * @returns Filas válidas. / Valid rows.
 */
function leerFilas(raw: string | null): string[][] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v)) {
      return v.filter((f): f is string[] => Array.isArray(f) && f.every((x): x is string => typeof x === "string"));
    }
  } catch {
    /* cae al error / falls through to error */
  }
  console.error("[x-tabla] filas no es JSON válido / invalid JSON filas");
  return [];
}
