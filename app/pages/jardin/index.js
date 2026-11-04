import { mountPage } from "../../lib/rtw/index.js";
import { Jardin } from "../../components/jardin/index.js";
import { NoEncontrado } from "../../components/no-encontrado/index.js";
export function mountJardin(target) {
    return mountPage(target, import.meta.url, [Jardin, NoEncontrado]);
}
