import { mountLayout } from "../../lib/rtw/index.js";
import { Navigation } from "../../components/navigation/index.js";
import { Footer } from "../../components/footer/index.js";
import { LangSwitch } from "../../components/lang-switch/index.js";
import { Fondo } from "../../components/fondo/index.js";

/**
 * Monta el layout en `target`. Al importar los componentes arriba,
 * sus etiquetas quedan registradas y el navegador las sustituye
 * en vivo al estampar el html.
 * Mounts the layout into `target`. Importing the components above
 * registers their tags, so the browser swaps them live when stamping.
 * @param target - Contenedor real. / Real container.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountMain(target: Element): Promise<void> {
  return mountLayout(target, import.meta.url, [Navigation, Footer, LangSwitch, Fondo]);
}
