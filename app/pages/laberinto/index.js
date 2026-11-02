import { mountPage } from "../../lib/rtw/index.js";
import { Btn } from "../../components/btn/index.js";
import { Laberinto } from "../../components/laberinto/index.js";
import { Pantalla } from "../../components/pantalla/index.js";
export function mountLaberinto(target) {
    return mountPage(target, import.meta.url, [Btn, Laberinto, Pantalla]);
}
