import { mountPage } from "../../lib/rtw/index.js";
import { NoEncontrado } from "../../components/no-encontrado/index.js";
export function mountNoEncontrado(target) {
    return mountPage(target, import.meta.url, [NoEncontrado]);
}
