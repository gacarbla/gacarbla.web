import { mountPage } from "../../lib/rtw/index.js";

/**
 * Monta la page de contacto dentro del <page> de su layout.
 * Mounts the contacto page inside its layout <page>.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountContacto(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, []);
}
