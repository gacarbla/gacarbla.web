import { mountPage } from "../../lib/rtw/index.js";
import { Seccion } from "../../components/seccion/index.js";
export function mountCauce(target) {
    return mountPage(target, import.meta.url, [Seccion]);
}
