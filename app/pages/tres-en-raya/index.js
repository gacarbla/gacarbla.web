import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Tres } from "../../components/tres/index.js";
import { Pantalla } from "../../components/pantalla/index.js";
export function mountTres(target) {
    return mountPage(target, import.meta.url, [Btn, Tres, Pantalla]);
}
