import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { FISICA, bolsa, tramo, verifica, type ObEv } from "./nivel.js";

/**
 * Minijuego estilo Geometry Dash (sin música): cubo que corre solo,
 * salta con Espacio/clic/toque y esquiva pinchos y bloques que entran
 * por la derecha.
 * Geometry-Dash-like minigame (no music): self-running cube that
 * jumps with Space/click/tap and dodges spikes and blocks coming
 * from the right.
 *
 * Modos / Modes:
 * - Mini (defecto, solo inicio): oculto abajo; se abre escribiendo
 *   "play" fuera de campos de texto. Uso: <x-juego></x-juego>.
 * - Full (sala de juegos): visible siempre, arranca solo y ocupa su
 *   ficha. Uso: <x-juego modo="full"></x-juego>.
 */
/**
 * Sesión viva de una instancia <x-juego>: panel, partida y entradas
 * (teclado, puntero, cierre y pantalla completa). Existe para que el
 * setup solo configure y conecte, sin lógica anidada.
 * Live session of an <x-juego> instance: panel, match and inputs
 * (keyboard, pointer, close and fullscreen). Exists so setup only
 * configures and wires, with no nested logic.
 */
class SesionJuego {
  /** Letras acumuladas del secreto "play". / Accumulated letters of the "play" secret. */
  private cola = "";

  /**
   * @param host - Etiqueta original (sigue montada = solo inicio). / Original tag (still mounted = home only).
   * @param root - Panel del juego en la sombra. / Game panel in the shadow.
   * @param canvas - Lienzo del juego. / Game canvas.
   * @param cerrar - Botón de cierre o null. / Close button or null.
   * @param esFull - Modo sala (siempre visible). / Room mode (always visible).
   * @param g - Partida en curso. / Ongoing match.
   */
  constructor(
    private readonly host: HTMLElement,
    private readonly root: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly cerrar: HTMLButtonElement | null,
    private readonly esFull: boolean,
    private readonly g: Partida,
  ) {}

  /**
   * Abre el panel y arranca con el cubo entrando desde la izquierda.
   * Opens the panel and starts with the cube sliding in from the left.
   */
  readonly abrir = (): void => {
    this.root.setAttribute("data-on", "");
    this.g.empezar();
  };

  /**
   * Cierra y para el bucle.
   * Closes and stops the loop.
   */
  readonly cerrarTodo = (): void => {
    this.root.removeAttribute("data-on");
    this.g.parar();
  };

  /**
   * En sala: el botón × reinicia en vez de ocultar (no hay panel que
   * esconder; de todos modos va oculto por CSS).
   * In the room: the × button restarts instead of hiding (no panel
   * to hide; hidden via CSS anyway).
   */
  readonly reiniciar = (): void => {
    this.g.empezar();
  };

  /**
   * Arranca si el host sigue montado (el canvas ya está maquetado).
   * Starts when the host is still mounted (canvas already laid out).
   */
  readonly arrancar = (): void => {
    if (this.host.isConnected) this.g.empezar();
  };

  /**
   * Muestra el panel según el modo y lo pone en marcha.
   * Shows the panel per mode and starts it.
   */
  readonly mostrarSegunModo = (): void => {
    if (!this.esFull) {
      this.cerrar?.addEventListener("click", this.cerrarTodo);
      return;
    }
    // Sala de juegos: visible desde el montaje y sin botón de cierre
    // (queda en espera hasta el primer salto). Arranca en el próximo
    // frame para medir el canvas ya maquetado.
    // Games room: visible from mount, no close button (waits for the
    // first jump). Starts next frame to measure the laid-out canvas.
    this.root.setAttribute("data-on", "");
    this.root.setAttribute("data-full", "");
    requestAnimationFrame(this.arrancar);
    this.cerrar?.addEventListener("click", this.reiniciar);
  };

  /**
   * Retira los oyentes del botón de cierre.
   * Removes the close-button listeners.
   */
  readonly desconectarCierre = (): void => {
    this.cerrar?.removeEventListener("click", this.cerrarTodo);
    this.cerrar?.removeEventListener("click", this.reiniciar);
  };

  /**
   * ¿Tecla gestionable por el juego? Descarta composición IME y focos
   * de texto (inputs, áreas y desplegables).
   * Is this key manageable by the game? Discards IME composition and
   * text focuses (inputs, areas and selects).
   * @param e - Evento de teclado. / Keyboard event.
   * @returns false si el juego debe ignorarla. / false when the game must ignore it.
   */
  readonly esTeclaJuego = (e: KeyboardEvent): boolean => {
    if (e.isComposing) return false;
    const t = e.target as HTMLElement | null;
    const etiqueta = t?.tagName ?? "";
    if (etiqueta === "INPUT" || etiqueta === "TEXTAREA" || etiqueta === "SELECT") return false;
    return true;
  };

  /**
   * Secuencia "play" (insensible a mayúsculas): solo modo mini, con el
   * host montado (= solo en inicio) y fuera de campos de texto.
   * "play" sequence (case-insensitive): mini mode only, with the host
   * mounted (= home only) and outside text fields.
   * @param e - Evento de teclado. / Keyboard event.
   * @returns true si abre el panel y consume la tecla. / true when it opens the panel and consumes the key.
   */
  readonly consumeSecretoPlay = (e: KeyboardEvent): boolean => {
    if (this.esFull || !/^[a-zA-Z]$/.test(e.key)) return false;
    this.cola = (this.cola + e.key.toLowerCase()).slice(-4);
    if (this.cola !== "play" || !this.host.isConnected) return false;
    this.cola = "";
    this.abrir();
    return true;
  };

  /**
   * Gestiona Escape (cierra en mini) y salto (Espacio/FlechaArriba)
   * cuando el juego está abierto.
   * Handles Escape (closes in mini) and jump (Space/ArrowUp)
   * while the game is open.
   * @param e - Evento de teclado. / Keyboard event.
   * @returns true si la tecla quedó gestionada. / true when the key was handled.
   */
  readonly gestionaAbierto = (e: KeyboardEvent): boolean => {
    if (!this.g.abierto) return false;
    if (e.key === "Escape") {
      if (!this.esFull) this.cerrarTodo();
      return true;
    }
    if (e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      this.g.pulsar(true);
      return true;
    }
    return false;
  };

  /**
   * Teclado global: filtra, prueba el secreto "play" y delega al juego.
   * Global keyboard: filters, tries the "play" secret, then defers to the game.
   */
  readonly tratarTecla = (e: KeyboardEvent): void => {
    if (!this.esTeclaJuego(e)) return;
    if (this.consumeSecretoPlay(e)) return;
    this.gestionaAbierto(e);
  };

  /**
   * Suelta el salto al soltar Espacio o FlechaArriba.
   * Releases the jump on Space or ArrowUp release.
   */
  readonly soltarTecla = (e: KeyboardEvent): void => {
    if (e.key === " " || e.key === "ArrowUp") this.g.pulsar(false);
  };

  /**
   * Salta al pulsar sobre el lienzo (clic o toque).
   * Jumps on canvas press (click or tap).
   */
  readonly pulsarDentro = (e: PointerEvent): void => {
    e.preventDefault();
    this.g.pulsar(true);
    const soltar = (): void => {
      this.g.pulsar(false);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
  };
}

export const Juego = component("x-juego", import.meta.url, {
  attrs: ["modo"],
  setup({ shadow, host, attr, onCleanup }: SetupCtx) {
    const stopI18n = i18n.apply(shadow);
    onCleanup(stopI18n);
    const root = shadow.querySelector(".juego") as HTMLElement | null;
    const canvas = shadow.querySelector("canvas") as HTMLCanvasElement | null;
    const marca = shadow.querySelector(".marca");
    const cerrar = shadow.querySelector(".cerrar") as HTMLButtonElement | null;
    if (!root || !canvas) return;
    /** Sala de juegos: sin código secreto, a la vista y a lo grande. / Games room: no secret code, visible and big. */
    const esFull = (attr("modo") ?? host.getAttribute("modo") ?? "").toLowerCase() === "full";
    const g = new Partida(
      canvas,
      (texto) => {
        if (marca) marca.textContent = texto;
      },
      (corriendo) => {
        if (corriendo) root.removeAttribute("data-espera");
        else root.setAttribute("data-espera", "");
      },
    );
    const sesion = new SesionJuego(host, root, canvas, cerrar, esFull, g);
    canvas.addEventListener("pointerdown", sesion.pulsarDentro);
    window.addEventListener("keydown", sesion.tratarTecla);
    window.addEventListener("keyup", sesion.soltarTecla);
    sesion.mostrarSegunModo();
    onCleanup(() => {
      window.removeEventListener("keydown", sesion.tratarTecla);
      window.removeEventListener("keyup", sesion.soltarTecla);
      canvas.removeEventListener("pointerdown", sesion.pulsarDentro);
      sesion.desconectarCierre();
      g.parar();
    });
  },
});

/** Obstáculo: pincho(s) o bloque pisables (ver nivel.ts). / Obstacle: spike(s) or steppable block (see nivel.ts). */
type Puas = ObEv;

/**
 * Partida completa: física, generador, colisiones y dibujo en canvas.
 * Full match: physics, spawner, collisions and canvas drawing.
 */
class Partida {
  /** Visible y corriendo. / Visible and running. */
  abierto = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private vivo = false;
  private ultimo = 0;
  private sueloY = 0;
  /** Distancia recorrida (m). Solo sube en marcha. / Traveled distance (m). Only rises while running. */
  private dist = 0;
  /** Desfile estético del suelo en espera (no puntúa). / Cosmetic ground scroll while waiting (scores nothing). */
  private desfile = 0;
  /** En marcha: puntos y obstáculos activos. En espera: solo decorado. / Running: score and obstacles live. Waiting: decoration only. */
  private corriendo = false;
  private mejor = 0;
  private intentos = 0;
  private obs: Puas[] = [];
  private pads: Array<{ x: number; w: number }> = [];
  private orbes: Array<{ x: number; y: number }> = [];
  private proxima = 0;
  // Jugador. / Player.
  private jy = 0;
  private vy = 0;
  private enSuelo = true;
  private ang = 0;
  private agachado = false;
  /** Entrada: 0.85 s deslizándose desde la izquierda. / Intro: 0.85 s sliding from the left. */
  private intro = 0;
  private pulsado = false;
  private subiendo = 0;
  /** Tiempo en el aire para coyote; buffer de salto anticipado. / Airborne time for coyote; early-jump buffer. */
  private aire = 0;
  private colaSalto = 0;
  private muerto = 0;
  private estela: Array<{ x: number; y: number; a: number }> = [];
  private readonly reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * @param canvas - Lienzo del juego. / Game canvas.
   * @param pintarHud - Lleva el marcador al DOM. / Pushes score to DOM.
   * @param alEstado - Avisa al DOM si hay marcha o espera. / Tells the DOM whether running or waiting.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly pintarHud: (texto: string) => void,
    private readonly alEstado: (corriendo: boolean) => void,
  ) {
    try {
      this.mejor = Number(localStorage.getItem("rtw:gplay") ?? 0) || 0;
    } catch {
      this.mejor = 0;
    }
  }

  /**
   * Abre en espera: el cubo entra deslizándose, el suelo desfila, pero
   * ni los puntos suben ni entran obstáculos hasta el primer salto.
   * Opens waiting: the cube slides in, the ground parades, but neither
   * the score rises nor obstacles arrive until the first jump.
   */
  empezar(): void {
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) return;
    this.ajustar();
    window.addEventListener("resize", this.ajustar);
    this.abierto = true;
    this.intro = 0;
    this.dist = 0;
    this.corriendo = false;
    this.obs = [];
    this.pads = [];
    this.orbes = [];
    this.proxima = 500;
    this.vy = 0;
    this.enSuelo = true;
    this.ang = 0;
    this.muerto = 0;
    this.estela = [];
    this.intentos++;
    this.marca();
    this.alEstado(false);
    if (this.vivo) return;
    this.vivo = true;
    this.ultimo = performance.now();
    this.raf = requestAnimationFrame(this.paso);
  }

  /**
   * Para el bucle y el resize.
   * Stops the loop and resize handling.
   */
  parar(): void {
    this.vivo = false;
    this.abierto = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.ajustar);
  }

  /**
   * La primera pulsación tras la entrada pone el juego en marcha.
   * The first press after the intro starts the run.
   */
  private arrancaSiPrimera(): void {
    if (this.corriendo) return;
    this.corriendo = true;
    this.alEstado(true);
  }

  /**
   * Estado del salto (pulsado/soltado). La primera pulsación tras la
   * entrada pone el juego en marcha y salta.
   * Jump input state (pressed/released). The first press after the
   * intro starts the run and jumps.
   * @param dentro - true al pulsar. / true on press.
   */
  pulsar(dentro: boolean): void {
    if (!this.abierto || this.muerto > 0) return;
    if (dentro && this.intro >= 1) {
      this.arrancaSiPrimera();
      this.colaSalto = 0.12;
      if (!this.intentarSalto()) this.intentarOrbe();
    }
    this.pulsado = dentro;
  }

  /**
   * Salta si hay suelo o coyote (0,08 s de gracia tras salir).
   * Jumps on ground or coyote (0.08 s grace after leaving).
   * @returns true si saltó. / true when it jumped.
   */
  private intentarSalto(): boolean {
    if (this.enSuelo || this.aire < 0.08) {
      this.vy = -FISICA.vSalto;
      this.enSuelo = false;
      this.subiendo = 0;
      this.colaSalto = 0;
      return true;
    }
    return false;
  }

  /**
   * Doble salto en orbe cercano (40px).
   * Double jump on nearby orb (40px).
   */
  private intentarOrbe(): void {
    for (const o of this.orbes) {
      const dx = this.px() - o.x;
      const dy = this.jy + 16 - o.y;
      if (dx * dx + dy * dy < 40 * 40) {
        this.vy = -FISICA.vOrbe;
        this.subiendo = 0;
        this.colaSalto = 0;
        break;
      }
    }
  }

  /** Dimensiona al contenedor con DPR capado. / Sizes to container with capped DPR. */
  private readonly ajustar = (): void => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    const g = this.ctx;
    if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.sueloY = r.height - 64;
    this.jy = this.sueloY - 32;
  };

  /** Escribe intentos + metros + récord. / Writes attempts + meters + best. */
  private marca(): void {
    const m = Math.floor(this.dist / 50);
    if (m > this.mejor) {
      this.mejor = m;
      try {
        localStorage.setItem("rtw:gplay", String(m));
      } catch {
        /* récord opcional / optional best */
      }
    }
    this.pintarHud(`×${this.intentos} · ${m}m · ★${this.mejor}m`);
  }

  /** Un fotograma: física, colisiones y dibujo. / One frame: physics, collisions, drawing. */
  private readonly paso = (ahora: number): void => {
    if (!this.vivo) return;
    const dt = Math.min(50, ahora - this.ultimo) / 1000;
    this.ultimo = ahora;
    if (this.intro < 1) {
      this.intro = Math.min(1, this.intro + dt / 0.85);
    } else if (this.muerto > 0) {
      this.muerto -= dt;
      if (this.muerto <= 0) this.aEspera();
    } else if (this.corriendo) {
      this.avanzar(dt);
    } else {
      this.esperar(dt);
    }
    this.dibujar();
    this.raf = requestAnimationFrame(this.paso);
  };

  /** Tras morir: limpia, puntos a cero y queda en espera del próximo salto. / After dying: clears, zeroes score and waits for the next jump. */
  private aEspera(): void {
    this.obs = [];
    this.pads = [];
    this.orbes = [];
    this.dist = 0;
    this.proxima = 500;
    this.vy = 0;
    this.enSuelo = true;
    this.corriendo = false;
    this.ang = Math.round(this.ang / (Math.PI / 2)) * (Math.PI / 2);
    this.jy = this.sueloY - 32;
    this.marca();
    this.alEstado(false);
  }

  /**
   * Espera atractiva: cubo en el suelo y mundo desfilando sin puntuar,
   * sin generar ni chocar. El primer salto pone en marcha.
   * Idle wait: grounded cube and parading world with no score,
   * no spawns, no hits. The first jump starts the run.
   * @param dt - Segundos. / Seconds.
   */
  private esperar(dt: number): void {
    this.desfile += FISICA.vel * dt;
    this.jy = this.sueloY - 32;
    for (const e of this.estela) e.a -= dt * 1.4;
  }

  /**
   * Física del cubo: gravedad, coyote (0,08 s de gracia tras salir),
   * buffer de salto anticipado (0,12 s) y gravedad ×0,45 con pulsado;
   * aterriza con redondeo del giro.
   * Cube physics: gravity, coyote (0.08 s grace after leaving),
   * early-jump buffer (0.12 s) and gravity ×0.45 while held;
   * lands with the spin snapped.
   * @param dt - Segundos. / Seconds.
   */
  private integrarCubo(dt: number): void {
    this.colaSalto = Math.max(0, this.colaSalto - dt);
    if (this.enSuelo) {
      this.jy = this.sueloY - 32;
      this.aire = 0;
      if (this.colaSalto > 0) this.intentarSalto();
      return;
    }
    this.aire += dt;
    // Índice 0/1 sin ramificar: misma expresión que la ternaria original.
    // Branchless 0/1 index: same expression as the original ternary.
    const ayuda = Number(this.pulsado) & Number(this.subiendo < 0.16) & Number(this.vy < 0);
    const g = [FISICA.gravedad, FISICA.gravedad * 0.45][ayuda];
    this.subiendo += dt;
    this.vy += g * dt;
    this.jy += this.vy * dt;
    if (!this.reduceMotion) this.ang += 5.5 * dt;
    if (this.jy >= this.sueloY - 32) {
      this.jy = this.sueloY - 32;
      this.vy = 0;
      this.enSuelo = true;
      this.ang = Math.round(this.ang / (Math.PI / 2)) * (Math.PI / 2);
    }
  }

  /**
   * Desplaza el mundo y genera el siguiente tramo al agotarse la reserva.
   * Scrolls the world and spawns the next stretch when due.
   * @param dt - Segundos. / Seconds.
   */
  private desplazarMundo(dt: number): void {
    const VEL = FISICA.vel;
    for (const o of this.obs) o.x -= VEL * dt;
    for (const p of this.pads) p.x -= VEL * dt;
    for (const o of this.orbes) o.x -= VEL * dt;
    this.obs = this.obs.filter((o) => o.x + o.w > -60);
    this.pads = this.pads.filter((p) => p.x + p.w > -60);
    this.orbes = this.orbes.filter((o) => o.x > -60);
    this.proxima -= VEL * dt;
    if (this.proxima <= 0) this.generar();
  }

  /**
   * Registra la estela del cubo y la desvanece.
   * Records the cube trail and fades it out.
   * @param dt - Segundos. / Seconds.
   */
  private actualizarEstela(dt: number): void {
    this.estela.unshift({ x: this.px(), y: this.jy + 16, a: 0.5 });
    if (this.estela.length > 14) this.estela.pop();
    for (const e of this.estela) e.a -= dt * 1.4;
  }

  /**
   * Física del cubo + scroll del mundo + generador.
   * Cube physics + world scroll + spawner.
   * @param dt - Segundos. / Seconds.
   */
  private avanzar(dt: number): void {
    this.dist += FISICA.vel * dt;
    this.integrarCubo(dt);
    this.desplazarMundo(dt);
    this.chocar();
    this.actualizarEstela(dt);
    this.marca();
  }

  /**
   * X del jugador: 20% del ancho (mínimo 90). / Player X: 20% of width (min 90).
   * @returns Píxeles desde la izquierda. / Pixels from the left.
   */
  private startX(): number {
    const w = this.ancho();
    return Math.max(90, Math.round(w * 0.2));
  }

  /**
   * X del jugador (con intro deslizante desde fuera).
   * Player X (with sliding intro from outside).
   */
  private px(): number {
    const e = 1 - Math.pow(1 - this.intro, 3);
    return -50 + (this.startX() + 50) * e;
  }

  /** Genera el siguiente tramo verificado (dificultad por distancia). / Spawns the next verified stretch (difficulty by distance). */
  private generar(): void {
    const x = this.ancho() + 40;
    const d = Math.min(4, Math.floor(this.dist / 1200));
    const bolsaIds = bolsa(d);
    const id = bolsaIds[Math.floor(Math.random() * bolsaIds.length)];
    const t = tramo(id, x, this.sueloY);
    const fallos = verifica(t, this.sueloY);
    if (fallos.length > 0) {
      console.error(`[juego] tramo ${id} imposible, uso pincho simple / impossible stretch, using single spike:`, fallos.join("; "));
      this.obs.push({ x, w: 26, h: 26 });
      this.proxima = 360 + Math.random() * 220;
      return;
    }
    for (const o of t.obs) this.obs.push(o);
    for (const p of t.pads) this.pads.push(p);
    for (const o of t.orbes) this.orbes.push(o);
    this.proxima = Math.max(300, t.ancho + 300 + Math.random() * 240);
  }

  /** Ancho lógico del lienzo. / Logical canvas width. */
  private ancho(): number {
    return this.canvas.getBoundingClientRect().width || window.innerWidth;
  }

  /**
   * Cojines: rebotan al pisarlos (en suelo o cayendo).
   * Pads: bounce when stepped on (grounded or falling).
   */
  private chocarCojines(): void {
    const px = this.px();
    const jx0 = px - 16;
    const jx1 = px + 16;
    const jy1 = this.jy + 32;
    for (const p of this.pads) {
      // Bits 0/1 sin &&/||: mismas comparaciones que el original.
      // 0/1 bits without &&/||: same comparisons as the original.
      const solapa = Number(jx1 > p.x) & Number(jx0 < p.x + p.w);
      const cae = Number(this.enSuelo) | Number(this.vy >= 0);
      const toca = Number(jy1 >= this.sueloY - 14);
      if (solapa & cae & toca) {
        this.vy = -FISICA.vCojin;
        this.enSuelo = false;
        this.subiendo = 0;
      }
    }
  }

  /**
   * Pinchos recortados 9px: morir es determinista.
   * 9px-trimmed spikes: dying is deterministic.
   * @returns true si hubo choque. / true when something hit.
   */
  private chocarPinchos(): boolean {
    const px = this.px();
    const jx0 = px - 16;
    const jx1 = px + 16;
    const jy1 = this.jy + 32;
    for (const o of this.obs) {
      const ox0 = o.x;
      const ox1 = o.x + o.w;
      if (Number(jx1 <= ox0 + 4) | Number(jx0 >= ox1 - 4)) continue;
      const top = this.sueloY - o.h;
      const m = 9;
      if (Number(jx1 > ox0 + m) & Number(jx0 < ox1 - m) & Number(jy1 > top + m)) {
        this.morir();
        return true;
      }
    }
    return false;
  }

  /** Colisiones: pincho recortado 9px, cojín rebota. Sin bloques: morir es determinista. / Collisions: 9px-trimmed spike, pad bounces. No blocks: dying is deterministic. */
  private chocar(): void {
    this.chocarCojines();
    if (this.chocarPinchos()) return;
  }

  /** Muerte: puntos a cero, intentos y pausa breve. / Death: score to zero, attempts and short pause. */
  private morir(): void {
    this.dist = 0;
    this.muerto = 0.7;
    this.intentos++;
    this.marca();
  }

  /**
   * Pinta el suelo con sus marcas de velocidad.
   * Paints the ground with its speed marks.
   * @param ancho - Ancho lógico del lienzo. / Logical canvas width.
   */
  private pintarSuelo(ancho: number): void {
    const g = this.ctx as CanvasRenderingContext2D;
    // Suelo con marcas de velocidad. / Ground with speed marks.
    g.fillStyle = "#f2ede3";
    g.globalAlpha = 0.5;
    g.fillRect(0, this.sueloY, ancho, 2);
    g.globalAlpha = 0.25;
    // En espera desfila sin puntuar; en marcha manda la distancia.
    // While waiting it parades for free; while running distance rules.
    const marcha = this.corriendo ? this.dist : this.desfile;
    const off = this.muerto > 0 ? 0 : marcha % 60;
    for (let x = -off; x < ancho; x += 60) g.fillRect(x, this.sueloY + 8, 24, 2);
    g.globalAlpha = 1;
  }

  /**
   * Pinta la estela del cubo. / Paints the cube trail.
   */
  private pintarEstela(): void {
    const g = this.ctx as CanvasRenderingContext2D;
    const acento = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
    // Estela. / Trail.
    for (const e of this.estela) {
      if (e.a <= 0) continue;
      g.fillStyle = acento;
      g.globalAlpha = Math.max(0, e.a * 0.5);
      g.fillRect(e.x - 8, e.y - 8, 16, 16);
    }
    g.globalAlpha = 1;
  }

  /**
   * Pinta los pinchos. / Paints the spikes.
   */
  private pintarPinchos(): void {
    const g = this.ctx as CanvasRenderingContext2D;
    // Pinchos. / Spikes.
    for (const o of this.obs) {
      g.fillStyle = "#f2ede3";
      const n = Math.max(1, Math.round(o.w / 26));
      for (let i = 0; i < n; i++) {
        const x0 = o.x + (i * o.w) / n;
        const x1 = o.x + ((i + 1) * o.w) / n;
        g.beginPath();
        g.moveTo(x0, this.sueloY);
        g.lineTo((x0 + x1) / 2, this.sueloY - o.h);
        g.lineTo(x1, this.sueloY);
        g.closePath();
        g.fill();
      }
    }
  }

  /**
   * Pinta cojines y orbes. / Paints pads and orbs.
   * @param ahora - Tiempo en segundos. / Time in seconds.
   */
  private pintarPadsOrbes(ahora: number): void {
    const g = this.ctx as CanvasRenderingContext2D;
    // Cojines y orbes. / Pads and orbs.
    for (const p of this.pads) {
      g.fillStyle = "#ffd23f";
      g.fillRect(p.x, this.sueloY - 12, p.w, 12);
      g.fillStyle = "#8a5a2b";
      for (let x = p.x + 4; x < p.x + p.w - 4; x += 10) g.fillRect(x, this.sueloY - 12, 4, 12);
    }
    for (const o of this.orbes) {
      const r = 14 + Math.sin(ahora * 5 + o.x) * 2;
      g.strokeStyle = "#ffd23f";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(o.x, o.y, r, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#faf8f4";
      g.beginPath();
      g.arc(o.x, o.y, 4, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 1;
    }
  }

  /**
   * Pinta el cubo con su giro en el aire. / Paints the cube with its mid-air spin.
   */
  private pintarCubo(): void {
    const g = this.ctx as CanvasRenderingContext2D;
    const acento = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
    // Cubo con giro en el aire. / Cube with mid-air spin.
    const px = this.px();
    g.save();
    g.translate(px, this.jy + 16);
    g.rotate(this.ang);
    g.fillStyle = this.muerto > 0 ? "#e05252" : acento;
    g.fillRect(-16, -16, 32, 32);
    g.fillStyle = "#f2ede3";
    g.fillRect(-8, -8, 16, 16);
    g.restore();
  }

  /** Dibuja suelo, estela, cubo y obstáculos. / Draws ground, trail, cube and obstacles. */
  private dibujar(): void {
    const g = this.ctx;
    if (!g) return;
    const r = this.canvas.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    g.clearRect(0, 0, w, h);
    this.pintarSuelo(w);
    this.pintarEstela();
    this.pintarPinchos();
    this.pintarPadsOrbes(performance.now() / 1000);
    this.pintarCubo();
  }
}
