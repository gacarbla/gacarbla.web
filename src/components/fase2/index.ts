import { component, routeEvent, type SetupCtx } from "../../lib/rtw/index.js";
import {
  abrirFase2,
  guardarPalabraFase3,
  palabraFase2,
  verificarFase3,
} from "../../lib/fases.js";

/**
 * Fase 2: la puerta umbra. Solo se muestra si la palabra del poema 10
 * sigue en memoria; si falta o no descifra, 404. La palabra de esta
 * fase abre la puerta relicario.
 * Phase 2: the umbra door. Only shown when poem 10's word is still in
 * memory; if missing or undecryptable, 404. This phase's word opens
 * the relicario door.
 *
 * Uso / Usage: <x-fase2></x-fase2> en /umbra.
 */

/** Refs de la fase 2. / Phase 2 refs. */
interface Refs {
  fase: HTMLElement;
  texto: HTMLElement;
  forma: HTMLFormElement;
  palabra: HTMLInputElement;
  fallo: HTMLElement;
  noEncontrado: HTMLElement;
}

/**
 * Recoge las refs. / Collects the refs.
 * @param shadow - Raíz sombra. / Shadow root.
 * @returns Refs completas o null. / Full refs or null.
 */
function refsDe(shadow: ShadowRoot): Refs | null {
  const q = <T extends Element = HTMLElement>(n: string): T | null =>
    shadow.querySelector(`[data-ref="${n}"]`) as T | null;
  const r = {
    fase: q("fase"),
    texto: q("texto"),
    forma: q<HTMLFormElement>("forma"),
    palabra: q<HTMLInputElement>("palabra"),
    fallo: q("fallo"),
    noEncontrado: q("noEncontrado"),
  };
  return Object.values(r).every(Boolean) ? (r as Refs) : null;
}

export const Fase2 = component("x-fase2", import.meta.url, {
  setup({ shadow, host, onCleanup }: SetupCtx) {
    const refs = refsDe(shadow);
    if (!refs) return;

    /** Enseña el 404 y esconde la fase. / Shows the 404 and hides the phase. */
    const mostrar404 = (): void => {
      refs.fase.toggleAttribute("hidden", true);
      refs.noEncontrado.toggleAttribute("hidden", false);
    };

    /** Abre la fase con la palabra en memoria. / Opens the phase with the in-memory word. */
    const abrir = async (): Promise<void> => {
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

    /** Comprueba la palabra de la tercera puerta. / Checks the third door's word. */
    const enviar = async (e: Event): Promise<void> => {
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

    const onSubmit = (e: Event): void => {
      void enviar(e);
    };

    refs.forma.addEventListener("submit", onSubmit);
    onCleanup(() => refs.forma.removeEventListener("submit", onSubmit));
    void abrir();
  },
});
