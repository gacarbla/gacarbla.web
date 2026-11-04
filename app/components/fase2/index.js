import { component, routeEvent } from "../../lib/rtw/index.js";
import { abrirFase2, guardarPalabraFase3, palabraFase2, verificarFase3, } from "../../lib/fases.js";
function refsDe(shadow) {
    const q = (n) => shadow.querySelector(`[data-ref="${n}"]`);
    const r = {
        fase: q("fase"),
        texto: q("texto"),
        forma: q("forma"),
        palabra: q("palabra"),
        fallo: q("fallo"),
        noEncontrado: q("noEncontrado"),
    };
    return Object.values(r).every(Boolean) ? r : null;
}
export const Fase2 = component("x-fase2", import.meta.url, {
    setup({ shadow, host, onCleanup }) {
        const refs = refsDe(shadow);
        if (!refs)
            return;
        const mostrar404 = () => {
            refs.fase.toggleAttribute("hidden", true);
            refs.noEncontrado.toggleAttribute("hidden", false);
        };
        const abrir = async () => {
            const palabra = palabraFase2();
            if (!palabra) {
                mostrar404();
                return;
            }
            const texto = await abrirFase2(palabra);
            if (!texto) {
                mostrar404();
                return;
            }
            refs.texto.textContent = texto;
            refs.fase.toggleAttribute("hidden", false);
        };
        const enviar = async (e) => {
            e.preventDefault();
            const valor = refs.palabra.value.trim();
            if (!valor) {
                refs.fallo.textContent = "…";
                return;
            }
            refs.fallo.textContent = "…";
            if (!(await verificarFase3(valor))) {
                mostrar404();
                return;
            }
            guardarPalabraFase3(valor);
            host.dispatchEvent(routeEvent("relicario"));
        };
        const onSubmit = (e) => {
            void enviar(e);
        };
        refs.forma.addEventListener("submit", onSubmit);
        onCleanup(() => refs.forma.removeEventListener("submit", onSubmit));
        void abrir();
    },
});
