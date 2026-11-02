import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Juego } from "../../components/juego/index.js";

/**
 * Monta la page de inicio dentro del <page> de su layout.
 * Mounts the inicio page inside its layout <page>.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountInicio(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Btn, Juego]);
}
