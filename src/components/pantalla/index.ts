import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { alternarPantalla, vigilarPantalla } from "../../lib/pantalla.js";

/**
 * Botón de pantalla completa compartido por todos los juegos: mismo
 * aspecto y mismo funcionamiento en todas partes (clic, tecla "f",
 * icono y etiqueta según estado, oculto si el navegador lo impide).
 * Fullscreen button shared by every game: same look and behavior
 * everywhere (click, "f" key, icon and label per state, hidden when
 * the browser forbids it).
 *
 * Uso / Usage: <x-pantalla para=".juego"></x-pantalla>
 * @attr para - Selector del contenedor que ocupará la pantalla, resuelto
 * en la raíz donde vive el botón. / Selector of the container taking the
 * screen, resolved in the root hosting the button.
 * @attr tecla - Tecla de acceso directo (defecto "f"). / Shortcut key (defaults "f").
 */
/**
 * Lee un atributo del host (con valor por defecto).
 * Reads a host attribute (with default).
 */
function leeAttr(host: HTMLElement, attr: ((nombre: string) => string | null) | undefined, nombre: string, defecto: string): string {
  if (attr) {
    const v = attr(nombre);
    if (v !== null) return v.toLowerCase();
  }
  return (host.getAttribute(nombre) ?? defecto).toLowerCase();
}

/**
 * Resuelve el contenedor objetivo dentro de la raíz donde vive el botón.
 * Resolves the target container inside the root hosting the button.
 * @param host - El propio <x-pantalla>. / The <x-pantalla> itself.
 * @param selector - Selector CSS o vacío. / CSS selector or empty.
 */
function resolverObjetivo(host: HTMLElement, selector: string): Element | null {
  if (!selector) return null;
  const raiz = host.getRootNode();
  if (!(raiz instanceof ShadowRoot) && !(raiz instanceof Document)) return null;
  return raiz.querySelector(selector);
}

/**
 * ¿Se puede pedir pantalla completa sobre ese elemento?
 * Can fullscreen be requested on that element?
 */
function disponiblePara(el: Element | null): el is HTMLElement {
  return (
    !!el &&
    typeof (el as HTMLElement).requestFullscreen === "function" &&
    (typeof document === "undefined" || (document as Document).fullscreenEnabled !== false)
  );
}

/**
 * ¿El foco está en un campo de texto (no interceptar)?
 * Is the focus in a text field (don't intercept)?
 */
function esCampoTexto(t: EventTarget | null): boolean {
  return t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
}

export const Pantalla = component("x-pantalla", import.meta.url, {
  attrs: ["para", "tecla"],
  setup({ shadow, host, attr, onCleanup }: SetupCtx) {
    const stopI18n = i18n.apply(shadow);
    onCleanup(stopI18n);
    const boton = shadow.querySelector("button");
    const etiqueta = shadow.querySelector("[data-ref=etiqueta]");
    if (!boton) return;
    const objetivo = resolverObjetivo(host, leeAttr(host, attr, "para", ""));
    if (!disponiblePara(objetivo)) {
      host.setAttribute("hidden", "");
      return;
    }
    const tecla = leeAttr(host, attr, "tecla", "f");
    boton.setAttribute("aria-keyshortcuts", tecla);
    const aPantalla = (): void => alternarPantalla(objetivo);
    const quiereAlternar = (e: KeyboardEvent): boolean => {
      if (e.isComposing || e.key.toLowerCase() !== tecla) return false;
      return !esCampoTexto(e.target);
    };
    const alTeclado = (e: KeyboardEvent): void => {
      if (!quiereAlternar(e)) return;
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
