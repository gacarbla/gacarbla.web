import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Laberinto } from "../../components/laberinto/index.js";
import { Pantalla } from "../../components/pantalla/index.js";

/**
 * Monta la page del laberinto dentro del <page> de su layout.
 * Mounts the maze page inside its layout <page>.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountLaberinto(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Btn, Laberinto, Pantalla]);
}
