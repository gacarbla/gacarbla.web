import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Vista } from "../../components/vista/index.js";
export function mountJuegos(target) {
    return mountPage(target, import.meta.url, [Btn, Vista]);
}
