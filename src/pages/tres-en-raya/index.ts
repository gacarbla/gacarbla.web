import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Tres } from "../../components/tres/index.js";
import { Pantalla } from "../../components/pantalla/index.js";

/**
 * Monta la page del tres en raya dentro del <page> de su layout.
 * Mounts the tic-tac-toe page inside its layout <page>.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountTres(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Btn, Tres, Pantalla]);
}
