import { mountPage } from "../../lib/rtw/index.js";
import { Fase3 } from "../../components/fase3/index.js";
import { NoEncontrado } from "../../components/no-encontrado/index.js";
export function mountRelicario(target) {
    return mountPage(target, import.meta.url, [Fase3, NoEncontrado]);
}
