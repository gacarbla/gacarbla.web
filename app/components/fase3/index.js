import { component } from "../../lib/rtw/index.js";
import { FINAL } from "../jardin/datos.js";
import { abrirFase3, ganarInsignia, palabraFase3, verificarFinal, } from "../../lib/fases.js";
function refsDe(shadow) {
    const q = (n) => shadow.querySelector(`[data-ref="${n}"]`);
    const r = {
        fase: q("fase"),
        texto: q("texto"),
        mesa: q("mesa"),
        forma: q("forma"),
        palabra: q("palabra"),
        fallo: q("fallo"),
        completo: q("completo"),
        firma: q("firma"),
        noEncontrado: q("noEncontrado"),
    };
    return Object.values(r).every(Boolean) ? r : null;
}
export const Fase3 = component("x-fase3", import.meta.url, {
    setup({ shadow, onCleanup }) {
        const refs = refsDe(shadow);
        if (!refs)
            return;
        const mostrar404 = () => {
            refs.fase.toggleAttribute("hidden", true);
            refs.completo.toggleAttribute("hidden", true);
            refs.noEncontrado.toggleAttribute("hidden", false);
        };
        const abrir = async () => {
            const palabra = palabraFase3();
            if (!palabra) {
                mostrar404();
                return;
            }
            const texto = await abrirFase3(palabra);
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
            if (!(await verificarFinal(valor))) {
                mostrar404();
                return;
            }
            ganarInsignia();
            refs.fase.toggleAttribute("hidden", true);
            refs.firma.textContent = FINAL;
            refs.completo.toggleAttribute("hidden", false);
        };
        const onSubmit = (e) => {
            void enviar(e);
        };
        refs.forma.addEventListener("submit", onSubmit);
        onCleanup(() => refs.forma.removeEventListener("submit", onSubmit));
        void abrir();
    },
});
