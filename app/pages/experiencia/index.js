import { mountPage } from "../../lib/rtw/index.js";
import { Tabla } from "../../components/tabla/index.js";
export function mountExperiencia(target) {
    return mountPage(target, import.meta.url, [Tabla]);
}
