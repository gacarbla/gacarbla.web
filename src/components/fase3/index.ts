import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { FINAL } from "../jardin/datos.js";
import {
  abrirFase3,
  ganarInsignia,
  palabraFase3,
  verificarFinal,
} from "../../lib/fases.js";

/**
 * Fase 3: la puerta relicario. La palabra de la fase 2 debe seguir en
 * memoria. La palabra final no se guarda: si es correcta, gana la
 * insignia junto a GACARBLA y el archivo queda completo.
 * Phase 3: the relicario door. Phase 2's word must still be in memory.
 * The final word is not stored: when correct, it earns the badge next
 * to GACARBLA and the archive is complete.
 *
 * Uso / Usage: <x-fase3></x-fase3> en /relicario.
 */

/** Refs de la fase 3. / Phase 3 refs. */
interface Refs {
  fase: HTMLElement;
  texto: HTMLElement;
  mesa: HTMLElement;
  forma: HTMLFormElement;
  palabra: HTMLInputElement;
  fallo: HTMLElement;
  completo: HTMLElement;
  firma: HTMLElement;
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
    mesa: q("mesa"),
    forma: q<HTMLFormElement>("forma"),
    palabra: q<HTMLInputElement>("palabra"),
    fallo: q("fallo"),
    completo: q("completo"),
    firma: q("firma"),
    noEncontrado: q("noEncontrado"),
  };
  return Object.values(r).every(Boolean) ? (r as Refs) : null;
}

export const Fase3 = component("x-fase3", import.meta.url, {
  setup({ shadow, onCleanup }: SetupCtx) {
    const refs = refsDe(shadow);
    if (!refs) return;

    /** Enseña el 404 y esconde la fase. / Shows the 404 and hides the phase. */
    const mostrar404 = (): void => {
      refs.fase.toggleAttribute("hidden", true);
      refs.completo.toggleAttribute("hidden", true);
      refs.noEncontrado.toggleAttribute("hidden", false);
    };

    /** Abre la fase con la palabra en memoria. / Opens the phase with the in-memory word. */
    const abrir = async (): Promise<void> => {
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

    /** Comprueba la palabra final y gana la insignia. / Checks the final word and earns the badge. */
    const enviar = async (e: Event): Promise<void> => {
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

    const onSubmit = (e: Event): void => {
      void enviar(e);
    };

    refs.forma.addEventListener("submit", onSubmit);
    onCleanup(() => refs.forma.removeEventListener("submit", onSubmit));
    void abrir();
  },
});
