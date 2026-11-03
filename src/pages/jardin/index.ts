import { mountPage } from "../../lib/rtw/index.js";
import { Jardin } from "../../components/jardin/index.js";

/**
 * Monta El Archivo en su <page>. / Mounts The Archive in its <page>.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountJardin(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Jardin]);
}
