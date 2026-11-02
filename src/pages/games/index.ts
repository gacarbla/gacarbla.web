import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Vista } from "../../components/vista/index.js";

/**
 * Monta la lista de juegos dentro del <page> de su layout.
 * Cada juego vive en su propia ruta (/games/<nombre>).
 * Mounts the games list inside its layout <page>.
 * Each game lives on its own route (/games/<name>).
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountJuegos(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Btn, Vista]);
}
