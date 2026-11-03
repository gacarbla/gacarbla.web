import { mountPage } from "../../lib/rtw/index.js";
import { Seccion } from "../../components/seccion/index.js";

/**
 * Monta la tercera puerta del cauce. / Mounts the third door of the cauce.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountCauce(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Seccion]);
}
