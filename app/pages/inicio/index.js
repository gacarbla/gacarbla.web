import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Juego } from "../../components/juego/index.js";
export function mountInicio(target) {
    return mountPage(target, import.meta.url, [Btn, Juego]);
}
