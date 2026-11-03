import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { jugadaNivel, lineaGanadora, libres, otra, type Casilla, type Marca } from "./tablero.js";
import { emitirSello } from "../../lib/misterio.js";

/**
 * Tres en raya: contra la máquina (3 niveles) o dos jugadores en el
 * mismo equipo. La máquina es X siempre... no: el humano es X y la
 * máquina O. Imposible = minimax óptimo: nunca pierde.
 * Tic-tac-toe: against the machine (3 levels) or two hot-seat players.
 * The human is X and the machine is O. Impossible = optimal minimax:
 * it never loses.
 *
 * Uso / Usage: <x-tres></x-tres> en su page / on its page.
 */
export const Tres = component("x-tres", import.meta.url, {
  setup({ shadow, host, onCleanup }: SetupCtx) {
    const stopI18n = i18n.apply(shadow);
    onCleanup(stopI18n);
    const ref = <T extends Element = HTMLElement>(n: string): T | null =>
      shadow.querySelector(`[data-ref="${n}"]`) as T | null;
    const modoIaBtn = ref<HTMLButtonElement>("modoIa");
    const modoDuoBtn = ref<HTMLButtonElement>("modoDuo");
    const dificultadEl = ref("dificultad");
    const difBtns = [ref<HTMLButtonElement>("dif0"), ref<HTMLButtonElement>("dif1"), ref<HTMLButtonElement>("dif2")];
    const estadoEl = ref("estado");
    const turnoMark = ref("turnoMark");
    const tableroEl = ref("tablero");
    const mensajeEl = ref("mensaje");
    const marcadorEl = ref("marcador");
    const reiniciarBtn = ref<HTMLButtonElement>("reiniciar");
    const cajaEl = ref("caja");
    /**
     * Comprueba que todas las refs del DOM existen.
     * Checks that every DOM ref exists.
     * @returns True si todo está enlazado. / True when everything is bound.
     */
    const validarRefs = (): boolean => {
      const vistos: unknown[] = [
        modoIaBtn, modoDuoBtn, dificultadEl, estadoEl, turnoMark, tableroEl,
        mensajeEl, marcadorEl, reiniciarBtn, cajaEl,
        ...difBtns,
      ];
      return vistos.every(Boolean);
    };
    if (!validarRefs()) {
      return;
    }

    let modo: "ia" | "duo" = "ia";
    let nivel = 1;
    let celdas: Casilla[] = Array(9).fill(null);
    let turno: Marca = "X";
    let fin = false;
    let pensando = false;
    let puntos = { X: 0, O: 0, E: 0 };
    let tempor: ReturnType<typeof setTimeout> | null = null;
    let botones: HTMLButtonElement[] = [];

    /** La máquina es O y el humano X. / The machine is O and the human is X. */
    const leTocaALaMaquina = (): boolean => modo === "ia" && turno === "O" && !fin;

    /** Aviso con clave i18n (o lo limpia). / Notice with i18n key (or clears it). */
    const avisar = (key: string | null): void => {
      if (key) mensajeEl!.setAttribute("data-i18n", key);
      else mensajeEl!.removeAttribute("data-i18n");
      mensajeEl!.textContent = "";
      i18n.paint(shadow);
    };

    /** Pinta marca y línea ganadora de una casilla. / Paints a cell mark and winning line. */
    const marcaBoton = (b: HTMLButtonElement, i: number, g: readonly [number, number, number] | null): void => {
      b.textContent = celdas[i] ?? "";
      if (celdas[i] === "O") b.setAttribute("data-m", "O");
      else b.removeAttribute("data-m");
      if (g?.includes(i)) b.setAttribute("data-gana", "");
      else b.removeAttribute("data-gana");
    };

    /** Habilita la casilla si se puede jugar en ella. / Enables the cell when playable. */
    const estadoBoton = (b: HTMLButtonElement, i: number): void => {
      if (celdas[i] || fin || pensando || leTocaALaMaquina()) b.setAttribute("disabled", "");
      else b.removeAttribute("disabled");
    };

    /** Pinta todo desde el estado. / Paints everything from state. */
    const pintar = (): void => {
      modoIaBtn!.toggleAttribute("data-on", modo === "ia");
      modoDuoBtn!.toggleAttribute("data-on", modo === "duo");
      // Sin dificultad en dúo, pero con su hueco (nada se mueve). / No difficulty in duo, but keeping its room (nothing shifts).
      const sinDificultad = modo !== "ia";
      dificultadEl!.toggleAttribute("data-vacio", sinDificultad);
      dificultadEl!.setAttribute("aria-hidden", String(sinDificultad));
      difBtns.forEach((b, i) => {
        if (!b) return;
        b.toggleAttribute("data-on", i === nivel);
        if (sinDificultad) b.setAttribute("disabled", "");
        else b.removeAttribute("disabled");
      });
      const g = lineaGanadora(celdas);
      botones.forEach((b, i) => {
        marcaBoton(b, i, g);
        estadoBoton(b, i);
      });
      estadoEl!.toggleAttribute("data-vacio", fin);
      if (!fin) turnoMark!.textContent = turno;
      marcadorEl!.innerHTML = "";
      const orden: Array<{ etiqueta: string | null; clave: string | null; tantos: number }> = [
        { etiqueta: "X", clave: null, tantos: puntos.X },
        { etiqueta: null, clave: "tres.empates", tantos: puntos.E },
        { etiqueta: "O", clave: null, tantos: puntos.O },
      ];
      for (const f of orden) {
        const s = document.createElement("span");
        s.className = "ficha";
        if (f.etiqueta) {
          const d = document.createElement("strong");
          d.textContent = f.etiqueta;
          if (f.etiqueta === "O") d.style.color = "var(--accent)";
          s.appendChild(d);
        } else if (f.clave) {
          const d = document.createElement("span");
          d.setAttribute("data-i18n", f.clave);
          s.appendChild(d);
        }
        const t = document.createElement("span");
        t.textContent = `×${f.tantos}`;
        s.appendChild(t);
        marcadorEl!.appendChild(s);
      }
      i18n.paint(shadow);
    };

    /**
     * Pone la marca y resuelve el turno.
     * Places the mark and resolves the turn.
     * @param i - Casilla jugada. / Played cell.
     * @param marca - Bando que juega. / Side to play.
     * @returns "gana" con línea, "tablas" si se llenó, "sigue" si continúa. / "gana" on line, "tablas" when full, "sigue" otherwise.
     */
    const aplicarJugada = (i: number, marca: Marca): "gana" | "tablas" | "sigue" => {
      celdas[i] = marca;
      if (lineaGanadora(celdas)) return "gana";
      if (libres(celdas).length === 0) return "tablas";
      turno = otra(marca);
      return "sigue";
    };

    /** Cierra la partida con su resultado. / Closes the match with its result. */
    const cerrar = (ganadora: Marca | null): void => {
      fin = true;
      pensando = false;
      if (ganadora) {
        puntos[ganadora]++;
        avisar(ganadora === "X" ? "tres.gana_x" : "tres.gana_o");
      } else {
        puntos.E++;
        avisar("tres.empate");
      }
      // Sello del misterio: ganar a la máquina en normal. / Mystery seal: beat the machine on normal.
      if (ganadora === "X" && modo === "ia" && nivel === 1) mostrarSello();
      pintar();
    };

    /**
     * Emite y pinta el sello de la victoria. / Emits and paints the victory seal.
     */
    const mostrarSello = (): void => {
      const sello = emitirSello("tres");
      if (!sello) return;
      mensajeEl!.textContent = `Sello: ${sello}`;
      mensajeEl!.removeAttribute("data-i18n");
    };

    /**
     * Paso de la máquina tras la pausa (usa aplicarJugada).
     * Machine step after the pause (uses aplicarJugada).
     */
    const pensarPaso = (): void => {
      if (!host.isConnected) return;
      const j = jugadaNivel(celdas, "O", nivel);
      const r = aplicarJugada(j, "O");
      if (r === "gana") {
        cerrar("O");
        return;
      }
      if (r === "tablas") {
        cerrar(null);
        return;
      }
      pensando = false;
      avisar(null);
      pintar();
    };

    /** Turno de la máquina con pequeña pausa. / Machine turn with a short pause. */
    const pensar = (): void => {
      if (!leTocaALaMaquina()) return;
      pensando = true;
      pintar();
      if (tempor !== null) clearTimeout(tempor);
      tempor = setTimeout(pensarPaso, 450);
    };

    /** Resuelve el resultado de una jugada. / Resolves a move result. */
    const resolverJugada = (r: "gana" | "tablas" | "sigue", marca: Marca): void => {
      if (r === "gana") {
        cerrar(marca);
        return;
      }
      if (r === "tablas") {
        cerrar(null);
        return;
      }
      avisar(null);
      pintar();
      pensar();
    };

    /** Intenta marcar una casilla. / Tries to mark a cell. */
    const jugar = (i: number): void => {
      if (fin || pensando || celdas[i]) return;
      if (leTocaALaMaquina()) return;
      resolverJugada(aplicarJugada(i, turno), turno);
    };

    /** Tablero nuevo (los tantos quedan). / Fresh board (scores stay). */
    const reiniciar = (): void => {
      if (tempor !== null) clearTimeout(tempor);
      celdas = Array(9).fill(null);
      turno = "X";
      fin = false;
      pensando = false;
      avisar(null);
      pintar();
    };

    /**
     * Crea las 9 celdas del tablero. / Builds the 9 board cells.
     */
    const construirTablero = (): void => {
      // Tablero. / Board.
      tableroEl!.innerHTML = "";
      botones = [];
      for (let i = 0; i < 9; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cel";
        b.setAttribute("role", "gridcell");
        b.setAttribute("aria-label", String(i + 1));
        b.addEventListener("click", () => jugar(i));
        tableroEl!.appendChild(b);
        botones.push(b);
      }
    };

    /**
     * Enlaza todos los controles. / Wires all the controls.
     */
    const enlazarControles = (): void => {
      modoIaBtn!.addEventListener("click", () => {
        modo = "ia";
        reiniciar();
      });
      modoDuoBtn!.addEventListener("click", () => {
        modo = "duo";
        reiniciar();
      });
      difBtns.forEach((b, i) =>
        b?.addEventListener("click", () => {
          nivel = i;
          reiniciar();
        }),
      );
      reiniciarBtn!.addEventListener("click", reiniciar);
      onCleanup(() => {
        if (tempor !== null) clearTimeout(tempor);
      });
    };

    construirTablero();
    pintar();
    enlazarControles();
  },
});
