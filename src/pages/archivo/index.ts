import { mountPage } from "../../lib/rtw/index.js";
import { Misterio } from "../../components/misterio/index.js";

/**
 * Monta el tablero del misterio en su <page>.
 * Mounts the mystery board in its <page>.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountArchivo(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Misterio]);
}
