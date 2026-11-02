import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Juego } from "../../components/juego/index.js";
import { Pantalla } from "../../components/pantalla/index.js";

/**
 * Monta la page del cubo dentro del <page> de su layout.
 * Mounts the cube page inside its layout <page>.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountCubo(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Btn, Juego, Pantalla]);
}
