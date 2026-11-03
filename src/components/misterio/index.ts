import { component, type SetupCtx } from "../../lib/rtw/index.js";
import {
  aceptar,
  desenlace,
  etapaActual,
  leerEstado,
  olvidar,
  pistaActual,
  resuelto,
  totalEtapas,
  type Estado,
  type Resultado,
} from "../../lib/misterio.js";

/** Refs del tablero. / Board refs. */
interface Refs {
  intro: HTMLElement;
  paso: HTMLElement;
  total: HTMLElement;
  fragmentos: HTMLElement;
  forma: HTMLFormElement;
  campo: HTMLInputElement;
  etiqueta: HTMLElement;
  fallo: HTMLElement;
  selloPista: HTMLElement;
  final: HTMLElement;
  olvidar: HTMLButtonElement;
}

/**
 * Recoge las refs del shadow (una sola guarda). / Collects shadow refs (single guard).
 * @param shadow - Raíz sombra. / Shadow root.
 */
function recogerRefs(shadow: ShadowRoot): Refs | null {
  const q = <T extends Element = HTMLElement>(n: string): T | null =>
    shadow.querySelector(`[data-ref="${n}"]`) as T | null;
  const r = {
    intro: q("intro"),
    paso: q("paso"),
    total: q("total"),
    fragmentos: q("fragmentos"),
    forma: q<HTMLFormElement>("forma"),
    campo: q<HTMLInputElement>("campo"),
    etiqueta: q("etiqueta"),
    fallo: q("fallo"),
    selloPista: q("selloPista"),
    final: q("final"),
    olvidar: q<HTMLButtonElement>("olvidar"),
  };
  return Object.values(r).every(Boolean) ? (r as Refs) : null;
}

/**
 * Tablero oculto del misterio: muestra la pista de la etapa actual, acepta
 * códigos o sellos y acumula fragmentos. No está enlazado desde la sala
 * de juegos: se descubre por la anomalía del pie.
 * Hidden mystery board: shows the current stage clue, accepts codes or
 * seals and collects fragments. Not linked from the arcade: it is
 * discovered through the footer anomaly.
 *
 * Uso / Usage: <x-misterio></x-misterio> en /archivo.
 */
export const Misterio = component("x-misterio", import.meta.url, {
  setup({ shadow, host, onCleanup }: SetupCtx) {
    const refs = recogerRefs(shadow);
    if (!refs) return;
    let estado: Estado = leerEstado();
    /** En marcha (evita dobles envíos). / Running (blocks double submits). */
    let ocupado = false;

    /** Pinta los fragmentos obtenidos. / Paints the collected fragments. */
    const pintarFragmentos = (): void => {
      refs.fragmentos.toggleAttribute("hidden", estado.fragmentos.length === 0);
      refs.fragmentos.innerHTML = "";
      for (const f of estado.fragmentos) {
        const s = document.createElement("span");
        s.textContent = f;
        refs.fragmentos.appendChild(s);
      }
    };

    /** Pinta el aviso de sello de la etapa. / Paints the stage seal notice. */
    const pintarSello = (etapa: ReturnType<typeof etapaActual>): void => {
      refs.selloPista.toggleAttribute("hidden", etapa?.tipo !== "sello");
      if (etapa?.tipo !== "sello") return;
      const sello = etapa.juego ? estado.sellos[etapa.juego] : undefined;
      refs.selloPista.textContent = sello
        ? "Sello detectado en tu partida. Escríbelo para abrir el caso."
        : "Aún no tienes el sello de este caso: gánalo en su juego y vuelve.";
    };

    /** Pinta todo desde el estado. / Paints everything from the state. */
    const pintar = (): void => {
      const terminado = resuelto(estado);
      const etapa = etapaActual(estado);
      refs.paso.textContent = String(Math.min(estado.paso + 1, totalEtapas()));
      refs.total.textContent = String(totalEtapas());
      refs.forma.toggleAttribute("hidden", terminado);
      refs.final.toggleAttribute("hidden", !terminado);
      pintarFragmentos();
      pintarSello(etapa);
      if (!terminado) refs.intro.textContent = pistaActual(estado) ?? "Caso en curso.";
      refs.etiqueta.textContent = etapa?.tipo === "sello" ? "Sello" : "Código";
      refs.campo.disabled = terminado;
      refs.campo.value = "";
    };

    /** Mensaje neutro de fallo. / Neutral failure message. */
    const mensajeFallo = (motivo: "vacio" | "no" | "sin-sello"): string => {
      if (motivo === "sin-sello") return "Este caso exige un sello de partida: consíguelo jugando.";
      if (motivo === "vacio") return "Escribe algo.";
      return "Ese código no abre ningún caso.";
    };

    /** Pinta el desenlace cifrado con la palabra final. / Paints the ending encrypted with the final word. */
    const revelar = async (): Promise<void> => {
      const texto = await desenlace(estado.fragmentos.join(""));
      if (texto) refs.final.textContent = texto;
      refs.final.toggleAttribute("hidden", false);
    };

    /** Aplica el resultado de aceptar. / Applies an accept outcome. */
    const aplicar = async (r: Resultado): Promise<void> => {
      if (!r.ok) {
        refs.fallo.textContent = mensajeFallo(r.motivo);
        return;
      }
      refs.fallo.textContent = "";
      estado = leerEstado();
      pintar();
      if (resuelto(estado)) await revelar();
      else refs.intro.textContent = r.pista;
      host.dispatchEvent(new CustomEvent("rtw:misterio", { bubbles: true, composed: true }));
    };

    /** Resuelve la entrada del jugador. / Resolves the player input. */
    const enviar = async (e: Event): Promise<void> => {
      e.preventDefault();
      if (ocupado) return;
      ocupado = true;
      refs.fallo.textContent = "Comprobando…";
      const r = await aceptar(estado, refs.campo.value);
      ocupado = false;
      await aplicar(r);
    };

    /** Reinicia el progreso. / Resets progress. */
    const borrar = (): void => {
      olvidar();
      estado = leerEstado();
      refs.fallo.textContent = "";
      refs.final.textContent = "";
      pintar();
    };

    refs.forma.addEventListener("submit", enviar);
    refs.olvidar.addEventListener("click", borrar);
    onCleanup(() => {
      refs.forma.removeEventListener("submit", enviar);
      refs.olvidar.removeEventListener("click", borrar);
    });

    pintar();
    if (resuelto(estado)) void revelar();
  },
});
