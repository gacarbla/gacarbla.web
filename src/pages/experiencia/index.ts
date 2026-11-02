import { mountPage } from "../../lib/rtw/index.js";
import { Tabla } from "../../components/tabla/index.js";

/**
 * Monta la page de experiencia dentro del <page> de su layout.
 * Mounts the experiencia page inside its layout <page>.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountExperiencia(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Tabla]);
}
