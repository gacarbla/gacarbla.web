import { mountPage } from "../../lib/rtw/index.js";
import { Fase2 } from "../../components/fase2/index.js";
import { NoEncontrado } from "../../components/no-encontrado/index.js";

/**
 * Monta la segunda puerta. / Mounts the second door.
 * @param target - Normalmente el <page>. / Usually the <page>.
 * @returns Se resuelve al estampar. / Resolves once stamped.
 */
export function mountUmbra(target: Element): Promise<void> {
  return mountPage(target, import.meta.url, [Fase2, NoEncontrado]);
}
