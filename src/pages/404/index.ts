import { mountPage } from "../../lib/rtw/index.js";
import { NoEncontrado } from "../../components/no-encontrado/index.js";

/**
 * Página 404 de la SPA. / SPA 404 page.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountNoEncontrado(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [NoEncontrado]);
}
