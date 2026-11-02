import { mountLayout } from "../../lib/rtw/index.js";
import { Navigation } from "../../components/navigation/index.js";
import { Footer } from "../../components/footer/index.js";
import { LangSwitch } from "../../components/lang-switch/index.js";
import { Fondo } from "../../components/fondo/index.js";
export function mountMain(target) {
    return mountLayout(target, import.meta.url, [Navigation, Footer, LangSwitch, Fondo]);
}
