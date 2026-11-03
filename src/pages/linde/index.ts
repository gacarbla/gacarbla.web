import { mountPage } from "../../lib/rtw/index.js";
import { Seccion } from "../../components/seccion/index.js";

/**
 * Monta la sección linde. / Mounts the linde section.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountLinde(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Seccion]);
}
