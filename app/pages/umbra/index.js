import { mountPage } from "../../lib/rtw/index.js";
import { Fase2 } from "../../components/fase2/index.js";
import { NoEncontrado } from "../../components/no-encontrado/index.js";
export function mountUmbra(target) {
    return mountPage(target, import.meta.url, [Fase2, NoEncontrado]);
}
