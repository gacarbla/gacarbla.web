import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Juego } from "../../components/juego/index.js";
import { Pantalla } from "../../components/pantalla/index.js";
export function mountCubo(target) {
    return mountPage(target, import.meta.url, [Btn, Juego, Pantalla]);
}
