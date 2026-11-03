import { mountPage } from "../../lib/rtw/index.js";
import { Fase3 } from "../../components/fase3/index.js";
import { NoEncontrado } from "../../components/no-encontrado/index.js";

/**
 * Monta la tercera puerta. / Mounts the third door.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountRelicario(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Fase3, NoEncontrado]);
}
