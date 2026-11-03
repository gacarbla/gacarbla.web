import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { generarMuros, colocarPunto, hayMuro, LADO, type Celda } from "./muros.js";
import { emitirSello } from "../../lib/misterio.js";

/**
 * Laberinto de paredes invisibles (1-4 jugadores hot-seat).
 * Rejilla 7x7 uniforme, 25 muros en aristas (conexos por greedy+BFS,
 * ver muros.ts), 10 s de mapa visible y luego a memoria.
 * Multijugador por turnos con dado 3D (1-2-2-3-3-4); en solitario no hay
 * turnos ni dado: movimiento libre paso a paso. Chocar con un muro
 * devuelve a tu esquina (y en grupo pierdes el turno) con animación
 * de muerte y reaparición, y deja ese muro pintado de tu color hasta
 * tu próxima muerte (hay uno por jugador). Las fichas se deslizan,
 * el pad toma el color del turno y el dado rueda en 3D. Gana 5 puntos.
 * Invisible-wall maze (1-4 hot-seat players).
 * Uniform 7x7 grid, 25 edge walls (connected via greedy+BFS, see
 * muros.ts), 10 s of visible map then memory. Multiplayer is turn
 * based with a 3D 1-2-2-3-3-4 die; solo has no turns or die: free
 * step-by-step movement. Hitting a wall sends you back to your
 * corner (losing the turn in a group) and leaves that wall painted
 * in your color (only the last one). Tokens slide and the pad takes
 * the turn color. 5 points win.
 *
 * Uso / Usage: <x-laberinto></x-laberinto> en su page / on its page.
 */

/** Puntos para ganar. / Points to win. */
const META = 5;
/** Segundos de mapa visible. / Seconds of visible map. */
const CUENTA = 10;
/** 4 colores de personaje. / 4 character colors. */
const COLORES = ["#e05252", "#4d8fd1", "#3fa34d", "#d9a419"] as const;
const COLOR_KEYS = ["lab.rojo", "lab.azul", "lab.verde", "lab.amarillo"] as const;
/** Las 4 esquinas: NO, NE, SO, SE. / The 4 corners: NW, NE, SW, SE. */
const ESQUINAS: Celda[] = [
  { x: 0, y: 0 },
  { x: LADO - 1, y: 0 },
  { x: 0, y: LADO - 1 },
  { x: LADO - 1, y: LADO - 1 },
];
const FLECHAS = ["↖", "↗", "↙", "↘"] as const;
const ESQ_KEYS = ["lab.esq_no", "lab.esq_ne", "lab.esq_so", "lab.esq_se"] as const;
/** Caras del cubo 3D: valor y giro que la trae al frente. / 3D cube faces: value and spin bringing it front. */
const CARAS_CUBO = [
  { v: 1, rx: 0, ry: 0 },
  { v: 2, rx: 0, ry: -90 },
  { v: 3, rx: 0, ry: 90 },
  { v: 4, rx: 0, ry: 180 },
  { v: 2, rx: -90, ry: 0 },
  { v: 3, rx: 90, ry: 0 },
] as const;
/** Colocación de cada cara (inversa del giro que la trae al frente). / Placement of each face (inverse of its fronting spin). */
const COLOCAR_CUBO = [
  "rotateY(0deg)",
  "rotateY(90deg)",
  "rotateY(-90deg)",
  "rotateY(180deg)",
  "rotateX(90deg)",
  "rotateX(-90deg)",
] as const;
/** Puntos de cada valor en rejilla 3x3. / Pips per value on a 3x3 grid. */
const PIPS: Record<number, number[]> = { 1: [5], 2: [3, 7], 3: [1, 5, 9], 4: [1, 3, 7, 9] };

/** Clave canónica de una arista (da igual el orden). / Canonical edge key (order-free). */
function claveArista(ax: number, ay: number, bx: number, by: number): string {
  return ax < bx || (ax === bx && ay < by) ? `${ax},${ay}|${bx},${by}` : `${bx},${by}|${ax},${ay}`;
}
/** Hueco de la configuración: color fijo, esquina pendiente o puesta. / Setup slot: fixed color, pending or placed corner. */
interface Slot {
  color: number;
  /** Índice en ESQUINAS o null (pendiente de clic). / Index into ESQUINAS or null (awaiting click). */
  esq: number | null;
}

/** Jugador en marcha. / Running player. */
interface Jug {
  color: number;
  x: number;
  y: number;
  ox: number;
  oy: number;
  puntos: number;
}

/** Fase de la partida. / Match phase. */
type Fase = "conf" | "mirando" | "tirar" | "pasos" | "elegir" | "fin";

/** Paso ortogonal [dx, dy]. / Orthogonal step [dx, dy]. */
type Dir = [number, number];

/**
 * Teclas de movimiento (flechas + WASD, con y sin mayúsculas).
 * Movement keys (arrows + WASD, lower and upper case).
 */
const TECLAS: Record<string, Dir> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  W: [0, -1],
  s: [0, 1],
  S: [0, 1],
  a: [-1, 0],
  A: [-1, 0],
  d: [1, 0],
  D: [1, 0],
};

/**
 * Acción que pide una tecla según la fase (paso, tirar o nada).
 * Action a key requests given the phase (step, roll or nothing).
 */
type AccionTecla = { kind: "paso"; dx: number; dy: number } | { kind: "tirar" } | { kind: "nada" };

/**
 * ¿El foco está en un campo editable (se ignora la tecla)?
 * Is focus on an editable field (key is ignored)?
 * @param t - Destino del evento. / Event target.
 * @returns true si hay que ignorar la tecla. / true when the key must be ignored.
 */
function esEditable(t: HTMLElement | null): boolean {
  if (t === null) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * ¿Es la tecla de tirar (espacio o Intro)?
 * Is it the roll key (space or Enter)?
 * @param key - Tecla pulsada. / Pressed key.
 * @returns true si es espacio o Intro. / true for space or Enter.
 */
function esTirar(key: string): boolean {
  return key === " " || key === "Enter";
}

/**
 * Despacha una tecla a paso / tirar / nada según fase y foco.
 * Dispatches a key to step / roll / nothing given phase and focus.
 * @param key - Tecla pulsada. / Pressed key.
 * @param fase - Fase actual. / Current phase.
 * @param esBoton - ¿El foco está en un botón? / Is focus on a button?
 * @returns La acción pedida. / The requested action.
 */
function accionTecla(key: string, fase: Fase, esBoton: boolean): AccionTecla {
  const paso = TECLAS[key];
  if (paso && fase === "pasos") return { kind: "paso", dx: paso[0], dy: paso[1] };
  if (esTirar(key) && fase === "tirar" && !esBoton) return { kind: "tirar" };
  return { kind: "nada" };
}

/**
 * Resultado de validar un paso: fuera del tablero, choque con arista,
 * captura del punto o avance libre (con destino).
 * Step validation result: off-board, wall hit with edge, dot capture
 * or free advance (with destination).
 */
type ResultPaso =
  | { kind: "fuera" }
  | { kind: "choque"; ax: number; ay: number; bx: number; by: number }
  | { kind: "captura"; nx: number; ny: number }
  | { kind: "ok"; nx: number; ny: number };

/**
 * ¿La casilla está fuera del tablero?
 * Is the cell off the board?
 * @param nx - Columna destino. / Destination column.
 * @param ny - Fila destino. / Destination row.
 * @returns true si está fuera. / true when off-board.
 */
function fueraDe(nx: number, ny: number): boolean {
  return nx < 0 || ny < 0 || nx >= LADO || ny >= LADO;
}

/**
 * Valida un paso ortogonal (bordes, muro y punto) sin mover nada.
 * Validates one orthogonal step (bounds, wall and dot) moving nothing.
 * @param jx - Columna actual. / Current column.
 * @param jy - Fila actual. / Current row.
 * @param dx - Paso horizontal. / Horizontal step.
 * @param dy - Paso vertical. / Vertical step.
 * @param muros - Muros de la partida. / Match walls.
 * @param punto - Punto a capturar o null. / Dot to capture or null.
 * @returns El resultado del paso. / The step result.
 */
function validarPaso(
  jx: number,
  jy: number,
  dx: number,
  dy: number,
  muros: ReadonlySet<string>,
  punto: Celda | null,
): ResultPaso {
  const nx = jx + dx;
  const ny = jy + dy;
  if (fueraDe(nx, ny)) return { kind: "fuera" };
  if (hayMuro(muros, jx, jy, nx, ny)) return { kind: "choque", ax: jx, ay: jy, bx: nx, by: ny };
  if (punto !== null && punto.x === nx && punto.y === ny) return { kind: "captura", nx, ny };
  return { kind: "ok", nx, ny };
}

/**
 * Bases a pintar: esquinas puestas (conf) o de la partida (mesa).
 * Bases to paint: placed corners (setup) or match ones (table).
 * @param fase - Fase actual. / Current phase.
 * @param slots - Huecos de configuración. / Setup slots.
 * @param jugs - Jugadores en marcha. / Running players.
 * @returns Mapa "x,y" -> color. / "x,y" -> color map.
 */
function baseDe(fase: Fase, slots: readonly Slot[], jugs: readonly Jug[]): Map<string, number> {
  const bases = new Map<string, number>();
  if (fase === "conf") {
    for (const s of slots) {
      if (s.esq === null) continue;
      const e = ESQUINAS[s.esq] as Celda;
      bases.set(`${e.x},${e.y}`, s.color);
    }
    return bases;
  }
  for (const j of jugs) bases.set(`${j.ox},${j.oy}`, j.color);
  return bases;
}

/**
 * Esquinas libres clicables durante la configuración.
 * Clickable free corners during setup.
 * @param fase - Fase actual. / Current phase.
 * @param pendiente - Hueco pendiente de esquina. / Corner-awaiting slot.
 * @param slots - Huecos de configuración. / Setup slots.
 * @returns Conjunto "x,y" libre. / Free "x,y" set.
 */
function libresConf(fase: Fase, pendiente: Slot | null, slots: readonly Slot[]): Set<string> {
  const libres = new Set<string>();
  if (fase !== "conf" || pendiente === null) return libres;
  for (let i = 0; i < ESQUINAS.length; i++) {
    if (slots.some((o) => o !== pendiente && o.esq === i)) continue;
    const e = ESQUINAS[i] as Celda;
    libres.add(`${e.x},${e.y}`);
  }
  return libres;
}

/**
 * Muros al este y al sur de una casilla (puros).
 * Walls east and south of a cell (pure).
 * @param x - Columna. / Column.
 * @param y - Fila. / Row.
 * @param muros - Muros de la partida. / Match walls.
 * @returns ¿Hay muro al este (me) y al sur (ms)? / Wall east (me) and south (ms)?
 */
function clasesMuro(x: number, y: number, muros: ReadonlySet<string>): { me: boolean; ms: boolean } {
  return {
    me: x + 1 < LADO && hayMuro(muros, x, y, x + 1, y),
    ms: y + 1 < LADO && hayMuro(muros, x, y, x, y + 1),
  };
}

/**
 * Pintura al este y al sur de una casilla (puros).
 * Painting east and south of a cell (pure).
 * @param x - Columna. / Column.
 * @param y - Fila. / Row.
 * @param pinturas - Arista pintada -> color. / Painted edge -> color.
 * @returns ¿Pintado al este (e) y al sur (s)? Más color ganador. / Painted east (e) and south (s)? Plus winning color.
 */
function clasePintura(
  x: number,
  y: number,
  pinturas: ReadonlyMap<string, number>,
): { e: boolean; s: boolean; color: number | undefined } {
  const colE = x + 1 < LADO ? pinturas.get(claveArista(x, y, x + 1, y)) : undefined;
  const colS = y + 1 < LADO ? pinturas.get(claveArista(x, y, x, y + 1)) : undefined;
  return { e: colE !== undefined, s: colS !== undefined, color: colE ?? colS };
}

/**
 * ¿El punto está en esa casilla (puro)?
 * Is the dot on that cell (pure)?
 * @param x - Columna. / Column.
 * @param y - Fila. / Row.
 * @param punto - Punto o null. / Dot or null.
 * @returns true si coincide. / true on match.
 */
function esPunto(x: number, y: number, punto: Celda | null): boolean {
  return punto !== null && punto.x === x && punto.y === y;
}

/** Contexto para pintar una casilla. / Context for painting one cell. */
interface CtxCelda {
  /** Columna. / Column. */
  x: number;
  /** Fila. / Row. */
  y: number;
  /** Muros de la partida. / Match walls. */
  muros: ReadonlySet<string>;
  /** Arista pintada -> color. / Painted edge -> color. */
  pinturas: ReadonlyMap<string, number>;
  /** Bases "x,y" -> color. / "x,y" -> color bases. */
  bases: ReadonlyMap<string, number>;
  /** Casillas libres clicables. / Clickable free cells. */
  libres: ReadonlySet<string>;
  /** Punto o null. / Dot or null. */
  punto: Celda | null;
}

/**
 * Pinta una sola casilla desde su contexto (sin bucles).
 * Paints a single cell from its context (no loops).
 * @param c - Elemento casilla. / Cell element.
 * @param ctx - Muros, pinturas, bases, libres y punto. / Walls, paintings, bases, free cells and dot.
 */
function pintarCelda(c: HTMLElement, ctx: CtxCelda): void {
  const muro = clasesMuro(ctx.x, ctx.y, ctx.muros);
  c.classList.toggle("me", muro.me);
  c.classList.toggle("ms", muro.ms);
  const gol = clasePintura(ctx.x, ctx.y, ctx.pinturas);
  c.classList.toggle("golpe-e", gol.e);
  c.classList.toggle("golpe-s", gol.s);
  if (gol.color !== undefined) c.style.setProperty("--wc", COLORES[gol.color] as string);
  else c.style.removeProperty("--wc");
  c.classList.toggle("libre", ctx.libres.has(`${ctx.x},${ctx.y}`));
  const base = ctx.bases.get(`${ctx.x},${ctx.y}`);
  if (base !== undefined) {
    c.classList.add("base");
    c.style.setProperty("--base", COLORES[base] as string);
  } else {
    c.classList.remove("base");
    c.style.removeProperty("--base");
  }
  c.innerHTML = "";
  if (esPunto(ctx.x, ctx.y, ctx.punto)) {
    const dentro = document.createElement("span");
    dentro.className = "dentro";
    const p = document.createElement("span");
    p.className = "punto-cel";
    dentro.appendChild(p);
    c.appendChild(dentro);
  }
}

/**
 * Elige una cara del dado al azar.
 * Picks a die face at random.
 * @returns Valor y giro que la trae al frente. / Value and spin bringing it front.
 */
function elegirCara(): { v: number; rx: number; ry: number } {
  const cara = CARAS_CUBO[Math.floor(Math.random() * CARAS_CUBO.length)] as {
    v: number;
    rx: number;
    ry: number;
  };
  return { v: cara.v, rx: cara.rx, ry: cara.ry };
}

/**
 * Giro acumulado hacia un destino (siempre hacia delante).
 * Accumulated spin towards a destination (always forward).
 * @param cur - Giro actual. / Current spin.
 * @param dest - Giro destino. / Destination spin.
 * @returns Giro acumulado equivalente. / Equivalent accumulated spin.
 */
function giroDestino(cur: number, dest: number): number {
  return cur + 720 + ((((dest - cur) % 360) + 360) % 360);
}

/** Trayectoria del lanzamiento: reposo final y fotogramas. / Throw path: final rest and keyframes. */
interface Trayectoria {
  /** Transformación de reposo. / Rest transform. */
  fin: string;
  /** Fotogramas WAAPI. / WAAPI keyframes. */
  frames: Keyframe[];
  /** Duración en ms. / Duration in ms. */
  dur: number;
}

/**
 * Calcula la trayectoria del lanzamiento (entra desde fuera o continúa
 * desde donde cayó). Pura salvo Math.random.
 * Computes the throw path (enters from outside or carries on from
 * where it landed). Pure except Math.random.
 * @param aterriza - ¿Aterriza en el tablero? / Does it land on the board?
 * @param reposo - Reposo actual o null. / Current rest or null.
 * @param bw - Ancho del tablero. / Board width.
 * @param bh - Alto del tablero. / Board height.
 * @returns Reposo final, fotogramas y duración. / Final rest, keyframes and duration.
 */
function trayectoriaLanzar(aterriza: boolean, reposo: string | null, bw: number, bh: number): Trayectoria {
  const aj = aterriza ? [0.18, 5, 85] : [0.08, 10, 80];
  const m = aj[0] as number;
  const zmin = aj[1] as number;
  const zmax = aj[2] as number;
  const dx = (Math.random() * 2 - 1) * m * bw;
  const dy = (Math.random() * 2 - 1) * m * bh;
  const rz = (zmin + Math.random() * (zmax - zmin)) * (Math.random() < 0.5 ? -1 : 1);
  const fin = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rz.toFixed(1)}deg)`;
  if (aterriza && reposo !== null) {
    // El lanzamiento empieza donde cayó: amago y a otro punto. / The throw starts where it landed: feint then elsewhere.
    const mid =
      `translate(${(dx * 0.25).toFixed(1)}px, ${(dy * 0.25 - Math.max(bw, bh) * 0.04).toFixed(1)}px)` +
      ` rotate(${(rz * 0.4).toFixed(1)}deg)`;
    return { fin, frames: [{ transform: reposo }, { transform: mid, offset: 0.35 }, { transform: fin }], dur: 900 };
  }
  // Entrada desde fuera del tablero. / Entrance from off the board.
  const ang = Math.random() * Math.PI * 2;
  const dist = Math.max(bw, bh) * 0.75;
  const iz = rz + (360 + Math.random() * 360) * (Math.random() < 0.5 ? -1 : 1);
  const ini =
    `translate(${(Math.cos(ang) * dist).toFixed(1)}px, ${(Math.sin(ang) * dist).toFixed(1)}px)` +
    ` rotate(${iz.toFixed(1)}deg)`;
  return { fin, frames: [{ transform: ini }, { transform: fin }], dur: 650 };
}

/**
 * Destino tras capturar: quedarse (solitario), elegir o tirar.
 * Destination after capturing: stay (solo), choose or roll.
 */
type DestinoCaptura = "quedar" | "elegir" | "tirar";

/**
 * Resuelve qué sigue tras una captura (pura).
 * Resolves what follows a capture (pure).
 * @param pasos - Pasos restantes. / Remaining steps.
 * @param solo - ¿Partida en solitario? / Solo match?
 * @returns Quedarse, elegir o tirar. / Stay, choose or roll.
 */
function resolverCaptura(pasos: number, solo: boolean): DestinoCaptura {
  if (solo) return "quedar";
  if (pasos > 0) return "elegir";
  return "tirar";
}

/**
 * Refs exigidas del DOM (todo lo que el setup necesita).
 * Required DOM refs (everything setup needs).
 */
interface Refs {
  /** Reloj de partida. / Match clock. */
  relojEl: HTMLElement;
  /** Colores disponibles. / Available colors. */
  disponibles: HTMLElement;
  /** Jugadores puestos. / Placed players. */
  puestos: HTMLElement;
  /** Botón empezar. / Start button. */
  empezarBtn: HTMLButtonElement;
  /** Lateral de configuración. / Setup side. */
  ladoSetup: HTMLElement;
  /** Lateral de puntos. / Score side. */
  ladoPuntos: HTMLElement;
  /** Marcador. / Scoreboard. */
  marcador: HTMLElement;
  /** Tablero. / Board. */
  tablero: HTMLElement;
  /** Previa (mapa visible). / Preview (visible map). */
  previa: HTMLElement;
  /** Cuenta atrás. / Countdown. */
  cuentaEl: HTMLElement;
  /** Botón saltar previa. / Skip preview button. */
  saltarBtn: HTMLButtonElement;
  /** Caja del juego (pantalla completa). / Game box (fullscreen). */
  cajaEl: HTMLElement;
  /** Aviso. / Notice. */
  mensajeEl: HTMLElement;
  /** Pad direccional. / Directional pad. */
  pad: HTMLElement;
  /** Botón seguir (tras captura). / Continue button (after capture). */
  seguirBtn: HTMLButtonElement;
  /** Pasos restantes (seguir). / Remaining steps (continue). */
  seguirN: HTMLElement;
  /** Botón pasar turno. / Pass turn button. */
  pasarBtn: HTMLButtonElement;
  /** Pantalla final. / Final screen. */
  finalEl: HTMLElement;
  /** Sello del misterio al ganar. / Mystery seal on victory. */
  selloOut: HTMLElement;
  /** Punto del ganador. / Winner dot. */
  ganadorPunto: HTMLElement;
  /** Botón revancha. / Rematch button. */
  revanchaBtn: HTMLButtonElement;
  /** Botón partida nueva. / New match button. */
  nuevaBtn: HTMLButtonElement;
  /** Botón-vidriera del dado. / Die showcase button. */
  dado3dEl: HTMLButtonElement;
  /** Cubo 3D. / 3D cube. */
  cuboEl: HTMLElement;
  /** Restos de pasos. / Remaining steps. */
  quedanEl: HTMLElement;
  /** Número de pasos restantes. / Remaining steps number. */
  quedanN: HTMLElement;
  /** Pista del dado. / Die hint. */
  pistaDado: HTMLElement;
  /** Vela del tiro. / Roll veil. */
  tiroEl: HTMLElement;
  /** Lanzador (vaso) del dado. / Die thrower (glass). */
  lanzarEl: HTMLElement;
}

/**
 * Recoge todas las refs del shadow (una sola guarda nula).
 * Collects every shadow ref (a single null guard).
 * @param shadow - Raíz sombra. / Shadow root.
 * @returns Refs o null si falta alguna. / Refs or null when any is missing.
 */
function recogerRefs(shadow: ShadowRoot): Refs | null {
  const q = (n: string): HTMLElement | null => shadow.querySelector(`[data-ref="${n}"]`);
  const r = {
    relojEl: q("reloj"),
    disponibles: q("disponibles"),
    puestos: q("puestos"),
    empezarBtn: q("empezar"),
    ladoSetup: q("ladoSetup"),
    ladoPuntos: q("ladoPuntos"),
    marcador: q("marcador"),
    tablero: q("tablero"),
    previa: q("previa"),
    cuentaEl: q("cuenta"),
    saltarBtn: q("saltar"),
    cajaEl: q("caja"),
    mensajeEl: q("mensaje"),
    pad: q("pad"),
    seguirBtn: q("seguir"),
    seguirN: q("seguirN"),
    pasarBtn: q("pasar"),
    finalEl: q("final"),
    selloOut: q("selloOut"),
    ganadorPunto: q("ganadorPunto"),
    revanchaBtn: q("revancha"),
    nuevaBtn: q("nueva"),
    dado3dEl: q("dado3d"),
    cuboEl: q("cubo"),
    quedanEl: q("quedan"),
    quedanN: q("quedanN"),
    pistaDado: q("pistaDado"),
    tiroEl: q("tiro"),
    lanzarEl: q("lanzar"),
  };
  for (const el of Object.values(r)) {
    if (el === null) return null;
  }
  return r as Refs;
}

export const Laberinto = component("x-laberinto", import.meta.url, {
  setup({ shadow, onCleanup }: SetupCtx) {
    const refs = recogerRefs(shadow);
    if (refs === null) return;
    const {
      relojEl,
      disponibles,
      puestos,
      empezarBtn,
      ladoSetup,
      ladoPuntos,
      marcador,
      tablero,
      previa,
      cuentaEl,
      saltarBtn,
      cajaEl,
      mensajeEl,
      pad,
      seguirBtn,
      seguirN,
      pasarBtn,
      finalEl,
      selloOut,
      ganadorPunto,
      revanchaBtn,
      nuevaBtn,
      dado3dEl,
      cuboEl,
      quedanEl,
      quedanN,
      pistaDado,
      tiroEl,
      lanzarEl,
    } = refs;
    const stopI18n = i18n.apply(shadow);

    let slots: Slot[] = [];
    /** Hueco pendiente de esquina (clic en el mapa). / Slot awaiting a corner (map click). */
    let pendiente: Slot | null = null;
    let jugs: Jug[] = [];
    let muros = new Set<string>();
    let punto: Celda | null = null;
    let fase: Fase = "conf";
    let turno = 0;
    let pasos = 0;
    let dado: number | null = null;
    let cuenta = CUENTA;
    let segundos = 0;
    let ticker: ReturnType<typeof setInterval> | null = null;
    let celdas: HTMLElement[] = [];
    /** Capa de fichas móviles sobre el tablero. / Moving-token layer over the board. */
    let capa: HTMLElement | null = null;
    /** Fichas persistentes por jugador (para deslizar). / Persistent tokens per player (for sliding). */
    const fichas = new Map<number, HTMLElement>();
    /** Sin animación en el próximo pintado (teletransporte). / No animation on next paint (teleport). */
    let sinAnim = false;
    /** Muros pintados: arista -> índice de color. Duran hasta la próxima muerte de quien los pintó. / Painted walls: edge -> color index. Last until their painter's next death. */
    let pinturas = new Map<string, number>();
    /** Último muro de cada jugador (índice de jugador -> arista). / Each player's last wall (player index -> edge). */
    let ultimoGolpe = new Map<number, string>();
    /** Muerte en curso (bloquea la entrada). / Death in progress (blocks input). */
    let muriendo = false;
    /** Jugador de la animación de muerte / nacimiento. / Player of the death / birth animation. */
    let muertoIdx: number | null = null;
    let naciendoIdx: number | null = null;
    /** Jugador del latido de captura. / Player of the capture thump. */
    let cazaIdx: number | null = null;
    let tMuerte: ReturnType<typeof setTimeout> | null = null;
    let tNace: ReturnType<typeof setTimeout> | null = null;
    let tCaza: ReturnType<typeof setTimeout> | null = null;
    /** Vela del dado sobre el tablero: tiro (clicable), rodando, resultado, saliendo (fundido) o nada. / Die veil over the board: roll (clickable), rolling, result, leaving (fade) or nothing. */
    let vela: "tiro" | "rodando" | "resultado" | "saliendo" | null = null;
    let tRes: ReturnType<typeof setTimeout> | null = null;
    let tSale: ReturnType<typeof setTimeout> | null = null;
    /** Giro acumulado del cubo. / Accumulated cube spin. */
    const giro = { x: 0, y: 0 };
    /** Animación WAAPI del cubo en curso. / Ongoing WAAPI cube animation. */
    let animDado: Animation | null = null;
    /** Animación WAAPI del lanzamiento en curso. / Ongoing throw WAAPI animation. */
    let animLanzar: Animation | null = null;
    /** Reposo actual del dado (donde cayó). / Die's current rest (where it landed). */
    let reposo: string | null = null;
    /** Montado (el fin del dado no pinta desmontado). / Mounted (die finish never paints unmounted). */
    let vivo = true;

    /** ¿Partida en solitario? Sin turnos ni dado. / Solo match? No turns or die. */
    const esSolo = (): boolean => jugs.length === 1;

    /** mm:ss. */
    const fmt = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    /** Construye las 49 casillas + la capa de fichas (una vez por montaje). / Builds the 49 cells + token layer (once per mount). */
    const armarTablero = (): void => {
      tablero.innerHTML = "";
      celdas = [];
      fichas.clear();
      for (let y = 0; y < LADO; y++) {
        for (let x = 0; x < LADO; x++) {
          const c = document.createElement("div");
          c.className = "cel";
          if (ESQUINAS.some((e) => e.x === x && e.y === y)) c.classList.add("esq");
          tablero.appendChild(c);
          celdas.push(c);
        }
      }
      capa = document.createElement("div");
      capa.className = "capa";
      tablero.appendChild(capa);
    };

    /** Construye las 6 caras del cubo con sus puntos. / Builds the 6 cube faces with their pips. */
    const armarDado = (): void => {
      cuboEl.innerHTML = "";
      CARAS_CUBO.forEach((cara, i) => {
        const f = document.createElement("div");
        f.className = "cara";
        f.style.transform = `${COLOCAR_CUBO[i] as string} translateZ(36px)`;
        for (const p of PIPS[cara.v] ?? []) {
          const s = document.createElement("span");
          s.className = "pipo";
          s.style.gridRow = String(Math.ceil(p / 3));
          s.style.gridColumn = String(((p - 1) % 3) + 1);
          f.appendChild(s);
        }
        cuboEl.appendChild(f);
      });
    };

    /** Aviso con clave i18n (o lo limpia). / Notice with i18n key (or clears it). */
    const avisar = (key: string | null): void => {
      if (key) mensajeEl.setAttribute("data-i18n", key);
      else mensajeEl.removeAttribute("data-i18n");
      mensajeEl.textContent = "";
      i18n.paint(shadow);
    };

    /** Posiciones actuales. / Current positions. */
    const posiciones = (): Celda[] => jugs.map((j) => ({ x: j.x, y: j.y }));
    /** Orígenes ocupados. / Taken origins. */
    const origenes = (): Celda[] => jugs.map((j) => ({ x: j.ox, y: j.oy }));

    /**
     * Pinta paneles y reloj según la fase (sin marcador ni controles).
     * Paints panels and clock from the phase (no scoreboard or controls).
     */
    const pintarVisibilidad = (): void => {
      ladoSetup.toggleAttribute("hidden", fase !== "conf");
      ladoPuntos.toggleAttribute("hidden", fase === "conf");
      previa.toggleAttribute("hidden", fase !== "mirando");
      finalEl.toggleAttribute("hidden", fase !== "fin");
      tablero.toggleAttribute("data-mirando", fase === "mirando");
      tablero.toggleAttribute("data-elige", fase === "conf" && pendiente !== null);
      tablero.toggleAttribute("data-golpe", pinturas.size > 0);
      relojEl.textContent = fmt(segundos);
      if (fase === "mirando") cuentaEl.textContent = String(cuenta);
    };

    /**
     * Pinta el marcador: punto de color + tantos (el turno se enmarca).
     * Paints the scoreboard: color dot + points (turn framed).
     */
    const pintarMarcador = (): void => {
      // Marcador: punto de color + tantos (el turno se enmarca). / Scoreboard: color dot + points (turn framed).
      marcador.innerHTML = "";
      jugs.forEach((j, i) => {
        const f = document.createElement("span");
        f.className = "ficha";
        if (i === turno && fase !== "fin" && fase !== "mirando") f.setAttribute("data-actual", "");
        const d = document.createElement("span");
        d.className = "punto";
        d.style.background = COLORES[j.color] as string;
        const t = document.createElement("strong");
        t.textContent = `×${j.puntos}`;
        f.append(d, t);
        marcador.appendChild(f);
      });
    };

    /**
     * ¿Hay tiro de dado visible para el jugador en turno?
     * Is there a visible die roll for the player in turn?
     * @returns El jugador en turno o undefined. / The player in turn or undefined.
     */
    const hayTiro = (): Jug | undefined => {
      if (esSolo()) return undefined;
      if (fase !== "tirar" && fase !== "elegir") return undefined;
      return jugs[turno];
    };

    /**
     * Pinta la vela del dado sobre el tablero.
     * Paints the die veil over the board.
     */
    const pintarVela = (): void => {
      // Vela del dado sobre el tablero. / Die veil over the board.
      const jt = hayTiro();
      dado3dEl.style.setProperty("--dado", jt !== undefined ? (COLORES[jt.color] as string) : "var(--accent)");
      tiroEl.toggleAttribute("hidden", vela === null);
      tiroEl.toggleAttribute("data-on", vela !== null && vela !== "saliendo");
      if (vela === "tiro") dado3dEl.removeAttribute("disabled");
      else dado3dEl.setAttribute("disabled", "");
      dado3dEl.toggleAttribute("data-listo", vela === "tiro");
      pistaDado.toggleAttribute("hidden", vela !== "tiro");
    };

    /**
     * Pinta el color del pad con el turno.
     * Paints the pad with the turn color.
     */
    const pintarPadColor = (): void => {
      // Controles por fase. El pad toma el color del turno (sin texto). / Controls per phase. The pad takes the turn color (no text).
      const enJuego = (fase === "tirar" || fase === "pasos" || fase === "elegir") && jugs[turno];
      pad.style.setProperty("--turno", enJuego ? (COLORES[jugs[turno]?.color ?? 0] as string) : "var(--accent)");
    };

    /**
     * Habilita el pad solo durante los pasos.
     * Enables the pad only during steps.
     */
    const pintarPadBotones = (): void => {
      const enPasos = fase === "pasos" && !muriendo && (esSolo() || pasos > 0);
      for (const b of pad.querySelectorAll("button")) {
        if (enPasos) b.removeAttribute("disabled");
        else b.setAttribute("disabled", "");
      }
    };

    /**
     * Pinta el botón de seguir tras capturar.
     * Paints the continue button after capturing.
     */
    const pintarSeguir = (): void => {
      seguirBtn.toggleAttribute("hidden", fase !== "elegir");
      if (fase === "elegir") {
        seguirN.textContent = String(pasos);
        if (vela !== "tiro") seguirBtn.setAttribute("disabled", "");
        else seguirBtn.removeAttribute("disabled");
      }
    };

    /**
     * Pinta el botón de pasar turno.
     * Paints the pass-turn button.
     */
    const pintarPasar = (): void => {
      pasarBtn.toggleAttribute("hidden", !(fase === "pasos" && !esSolo() && pasos <= 0));
    };

    /**
     * Pinta los pasos restantes.
     * Paints the remaining steps.
     */
    const pintarQuedan = (): void => {
      quedanEl.toggleAttribute("data-vacio", esSolo() || fase !== "pasos" || pasos <= 0);
      if (!esSolo() && fase === "pasos") quedanN.textContent = String(pasos);
    };

    /**
     * Pinta el ganador de la partida.
     * Paints the match winner.
     */
    const pintarGanador = (): void => {
      if (fase === "fin" && jugs[turno]) {
        (ganadorPunto as HTMLElement).style.background = COLORES[jugs[turno]?.color ?? 0] as string;
      }
    };

    /**
     * Pinta los controles: pad, vela, seguir, pasar, restos y ganador.
     * Paints the controls: pad, veil, continue, pass, remains and winner.
     */
    const pintarControles = (): void => {
      pintarPadColor();
      pintarVela();
      pintarPadBotones();
      pintarSeguir();
      pintarPasar();
      pintarQuedan();
      pintarGanador();
    };

    /** Pinta todo desde el estado. / Paints everything from state. */
    const pintar = (): void => {
      pintarVisibilidad();
      pintarMarcador();
      pintarControles();
      pintarLado();
      pintarTablero();
      pintarFichas();
    };

    /** Pinta muros (visibles en previa), pinturas, bases y punto. / Paints walls (visible in preview), paintings, bases and dot. */
    const pintarTablero = (): void => {
      // Bases: esquinas puestas (conf) o de la partida (mesa). / Bases: placed corners (setup) or match ones (table).
      const bases = baseDe(fase, slots, jugs);
      const libres = libresConf(fase, pendiente, slots);
      for (let y = 0; y < LADO; y++) {
        for (let x = 0; x < LADO; x++) {
          pintarCelda(celdas[y * LADO + x] as HTMLElement, {
            x,
            y,
            muros,
            pinturas,
            bases,
            libres,
            punto,
          });
        }
      }
    };

    /** Recupera o crea la ficha de un jugador. / Gets or creates a player token. */
    const obtenerFicha = (i: number): HTMLElement => {
      let el = fichas.get(i);
      if (!el) {
        el = document.createElement("span");
        el.className = "ficha-movil";
        capa?.appendChild(el);
        fichas.set(i, el);
      }
      return el;
    };

    /** Marca el estado visual de una ficha (turno/muerte/nacimiento/captura). / Marks a token visual state (turn/death/birth/catch). */
    const marcarFicha = (el: HTMLElement, i: number): void => {
      el.toggleAttribute("data-actual", i === turno && fase !== "fin" && fase !== "conf" && fase !== "mirando");
      el.toggleAttribute("data-muriendo", muriendo && i === muertoIdx);
      el.toggleAttribute("data-naciendo", i === naciendoIdx);
      el.toggleAttribute("data-caza", i === cazaIdx);
    };

    /** Coloca una ficha: tamaño, posición y marcas. / Places a token: size, position and marks. */
    const colocarFicha = (el: HTMLElement, j: Jug, i: number, junto: number[]): void => {
      const c = celdas[j.y * LADO + j.x] as HTMLElement;
      const t = Math.max(10, Math.min(c.offsetWidth, c.offsetHeight) * 0.58);
      const dx = (junto.indexOf(i) - (junto.length - 1) / 2) * t * 0.8;
      if (sinAnim) el.classList.add("sin");
      el.style.width = `${t}px`;
      el.style.height = `${t}px`;
      el.style.transform = `translate(${c.offsetLeft + (c.offsetWidth - t) / 2 + dx}px, ${c.offsetTop + (c.offsetHeight - t) / 2}px)`;
      el.style.background = COLORES[j.color] as string;
      marcarFicha(el, i);
      if (sinAnim) {
        void el.offsetWidth;
        el.classList.remove("sin");
      }
    };
    /** Pinta las fichas en la capa móvil (se deslizan; teletransporte sin animar). / Paints the tokens on the moving layer (they slide; teleport unanimated). */
    const pintarFichas = (): void => {
      if (!capa) return;
      for (const [i, el] of [...fichas]) {
        if (!jugs[i]) {
          el.remove();
          fichas.delete(i);
        }
      }
      const grupos = new Map<string, number[]>();
      jugs.forEach((j, i) => {
        const k = `${j.x},${j.y}`;
        if (!grupos.has(k)) grupos.set(k, []);
        (grupos.get(k) as number[]).push(i);
      });
      jugs.forEach((j, i) => {
        colocarFicha(obtenerFicha(i), j, i, grupos.get(`${j.x},${j.y}`) as number[]);
      });
      sinAnim = false;
    };

    /** Pinta el lateral: selector en conf, nada más (el marcador es estático). / Paints the side: picker in setup, nothing else (scoreboard is static). */
    const pintarLado = (): void => {
      if (fase !== "conf") return;
      disponibles.innerHTML = "";
      COLORES.forEach((hex, ci) => {
        if (slots.some((s) => s.color === ci)) return;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "disp";
        b.style.background = hex;
        b.setAttribute("data-i18n-aria-label", COLOR_KEYS[ci] as string);
        const mas = document.createElement("span");
        mas.className = "mas";
        mas.textContent = "+";
        b.appendChild(mas);
        b.addEventListener("click", () => elegirColor(ci));
        disponibles.appendChild(b);
      });
      puestos.innerHTML = "";
      slots.forEach((s) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "puesto";
        if (s === pendiente) b.setAttribute("data-pend", "");
        const d = document.createElement("span");
        d.className = "punto";
        d.style.background = COLORES[s.color] as string;
        b.appendChild(d);
        const e = document.createElement("span");
        e.className = "donde";
        e.textContent = s.esq === null ? "…" : (FLECHAS[s.esq] as string);
        b.appendChild(e);
        b.addEventListener("click", () => quitarSlot(s));
        puestos.appendChild(b);
      });
      const listo = slots.length > 0 && slots.every((s) => s.esq !== null);
      if (listo) empezarBtn.removeAttribute("disabled");
      else empezarBtn.setAttribute("disabled", "");
      i18n.paint(shadow);
    };

    /** Suma un jugador pendiente de esquina. / Adds a player awaiting a corner. */
    const elegirColor = (ci: number): void => {
      if (fase !== "conf") return;
      if (pendiente !== null) slots = slots.filter((s) => s !== pendiente);
      const s: Slot = { color: ci, esq: null };
      slots.push(s);
      pendiente = s;
      avisar("lab.elige_esquina");
      pintar();
    };

    /** Retira un jugador (clic sobre él). / Removes a player (click on them). */
    const quitarSlot = (s: Slot): void => {
      if (fase !== "conf") return;
      slots = slots.filter((o) => o !== s);
      if (pendiente === s) pendiente = null;
      avisar(null);
      pintar();
    };

    /** Para el reloj de la partida. / Stops the match clock. */
    const pararReloj = (): void => {
      if (ticker !== null) {
        clearInterval(ticker);
        ticker = null;
      }
    };

    /** Limpia temporizadores del dado pendiente. / Clears pending die timers. */
    const pararTiros = (): void => {
      if (tRes !== null) clearTimeout(tRes);
      if (tSale !== null) clearTimeout(tSale);
      tRes = tSale = null;
      animLanzar?.cancel();
      animLanzar = null;
      lanzarEl.style.transform = "";
      reposo = null;
      vela = null;
    };

    /** Empieza la partida: muros nuevos, reloj a cero y 10 s de mapa visible. / Starts the match: fresh walls, clock to zero and 10 s of visible map. */
    const iniciarPartida = (): void => {
      muros = generarMuros();
      pinturas = new Map();
      ultimoGolpe = new Map();
      pararAnims();
      pararTiros();
      sinAnim = true;
      animDado?.cancel();
      animDado = null;
      vela = null;
      jugs = slots
        .filter((s) => s.esq !== null)
        .map((s) => {
          const o = ESQUINAS[s.esq as number] as Celda;
          return { color: s.color, x: o.x, y: o.y, ox: o.x, oy: o.y, puntos: 0 };
        });
      if (jugs.length === 0) return;
      punto = null;
      turno = 0;
      pasos = 0;
      dado = null;
      cuenta = CUENTA;
      segundos = 0;
      pendiente = null;
      irA("mirando");
      avisar(null);
      pararReloj();
      ticker = setInterval(() => {
        segundos++;
        relojEl.textContent = fmt(segundos);
        if (fase === "mirando") {
          cuenta--;
          if (cuenta <= 0) terminarPrevia();
          else cuentaEl.textContent = String(cuenta);
        }
      }, 1000);
      pintar();
      // Tablero nuevo: pintura instantánea, sin fundidos. / Fresh board: instant painting, no fades.
      tablero.classList.add("sin");
      void tablero.offsetWidth;
      tablero.classList.remove("sin");
    };

    /** Esconde los muros y reparte el primer punto (y los pasos). / Hides the walls and deals the first dot (and steps). */
    const terminarPrevia = (): void => {
      if (fase !== "mirando") return;
      punto = colocarPunto(posiciones(), origenes());
      if (esSolo()) {
        pasos = 1;
        irA("pasos");
      } else {
        mostrarTiro("tirar");
      }
      pintar();
    };

    /** Pasa al siguiente jugador en espera de dado. / Hands over to the next player awaiting the die. */
    const siguienteTurno = (): void => {
      turno = (turno + 1) % Math.max(1, jugs.length);
      pasos = 0;
      dado = null;
      mostrarTiro("tirar");
      avisar(null);
      pintar();
    };

    /** Va a una fase con su vela coherente (el dado solo existe en tiro/elección). / Goes to a phase with its coherent veil (the die only exists on roll/choice). */
    const irA = (f: Fase): void => {
      fase = f;
      vela = (f === "tirar" || f === "elegir") && !esSolo() ? "tiro" : null;
    };

    /** Muestra la vela con entrada deslizada del dado. / Shows the veil with the die sliding in. */
    const mostrarTiro = (f: "tirar" | "elegir"): void => {
      irA(f);
      lanzarDado(false);
    };

    /** Desliza el dado como un vaso lanzado: entra desde fuera o continúa desde donde cayó y aterriza girando. / Slides the die like a thrown glass: enters from outside or carries on from where it landed, landing spinning. */
    const lanzarDado = (aterriza: boolean): void => {
      const t = trayectoriaLanzar(
        aterriza,
        reposo,
        Math.max(1, tablero.clientWidth),
        Math.max(1, tablero.clientHeight),
      );
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        animLanzar?.cancel();
        animLanzar = null;
        lanzarEl.style.transform = aterriza ? t.fin : "none";
        reposo = aterriza ? t.fin : null;
        return;
      }
      animLanzar?.cancel();
      animLanzar = lanzarEl.animate(t.frames, {
        duration: t.dur,
        easing: "cubic-bezier(.2,.7,.25,1)",
      });
      animLanzar.onfinish = () => {
        animLanzar = null;
        if (!vivo) return;
        lanzarEl.style.transform = t.fin;
        reposo = t.fin;
      };
    };

    /**
     * Rueda el cubo 3D hasta su destino (respeta movimiento reducido).
     * Spins the 3D cube to its destination (honors reduced motion).
     * @param tx - Giro acumulado en X. / Accumulated X spin.
     * @param ty - Giro acumulado en Y. / Accumulated Y spin.
     * @returns Promesa que resuelve al terminar el giro. / Promise resolving when the spin ends.
     */
    const rodarCubo = (tx: number, ty: number): Promise<void> => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
      animDado?.cancel();
      const anim = cuboEl.animate(
        [
          { transform: `rotateX(${giro.x}deg) rotateY(${giro.y}deg)` },
          { transform: `rotateX(${tx}deg) rotateY(${ty}deg)` },
        ],
        { duration: 1100, easing: "cubic-bezier(.2,.75,.25,1)" },
      );
      animDado = anim;
      return new Promise<void>((res) => {
        anim.onfinish = () => {
          animDado = null;
          res();
        };
      });
    };

    /**
     * Muestra el resultado del dado y programa su salida (1600 ms).
     * Shows the die result and schedules its exit (1600 ms).
     * @param tx - Giro acumulado en X. / Accumulated X spin.
     * @param ty - Giro acumulado en Y. / Accumulated Y spin.
     * @param valor - Valor de la cara. / Face value.
     */
    const mostrarResultado = (tx: number, ty: number, valor: number): void => {
      if (!vivo) return;
      vela = "resultado";
      giro.x = tx;
      giro.y = ty;
      cuboEl.style.transform = `rotateX(${tx}deg) rotateY(${ty}deg)`;
      dado = valor;
      pasos = dado;
      pintar();
      if (tRes !== null) clearTimeout(tRes);
      tRes = setTimeout(ocultarResultado, 1600);
    };

    /**
     * Funde la vela del dado y pasa a la fase de pasos (450 ms).
     * Fades the die veil out and moves to the steps phase (450 ms).
     */
    const ocultarResultado = (): void => {
      if (!vivo) return;
      vela = "saliendo";
      pintar();
      if (tSale !== null) clearTimeout(tSale);
      tSale = setTimeout(() => {
        if (!vivo) return;
        irA("pasos");
        avisar(null);
        pintar();
      }, 450);
    };

    /** Tira el dado 3D y habilita los pasos (solo en grupo). / Rolls the 3D die and enables the steps (group only). */
    const tirar = (): void => {
      if (esSolo() || muriendo || vela !== "tiro") return;
      if (fase !== "tirar" && fase !== "elegir") return;
      const cara = elegirCara();
      const tx = giroDestino(giro.x, cara.rx);
      const ty = giroDestino(giro.y, cara.ry);
      vela = "rodando";
      lanzarDado(true);
      pintar();
      void rodarCubo(tx, ty).then(() => mostrarResultado(tx, ty, cara.v));
    };

    /** Limpia animaciones de muerte pendientes. / Clears pending death animations. */
    const pararAnims = (): void => {
      if (tMuerte !== null) clearTimeout(tMuerte);
      if (tNace !== null) clearTimeout(tNace);
      if (tCaza !== null) clearTimeout(tCaza);
      tMuerte = tNace = tCaza = null;
      muriendo = false;
      muertoIdx = naciendoIdx = cazaIdx = null;
    };

    /**
     * Registra el muro golpeado con el color del jugador (borra su anterior).
     * Registers the hit wall with the player's color (erases their previous one).
     * @param idx - Índice del jugador. / Player index.
     * @param k - Clave de la arista. / Edge key.
     */
    const registrarPintura = (idx: number, k: string): void => {
      const j = jugs[idx] as Jug;
      const vieja = ultimoGolpe.get(idx);
      if (vieja !== undefined && vieja !== k && pinturas.get(vieja) === j.color) pinturas.delete(vieja);
      pinturas.set(k, j.color);
      ultimoGolpe.set(idx, k);
    };

    /** Chocar con un muro: animación de muerte, vuelta a tu esquina con reaparición y pintado del muro (dura hasta tu próxima muerte). En grupo además pierdes el turno. / Hitting a wall: death animation, back to your corner with respawn and wall painting (lasts until your next death). In a group you also lose the turn. */
    const choque = (ax: number, ay: number, bx: number, by: number): void => {
      if (muriendo) return;
      const idx = turno;
      const j = jugs[idx] as Jug;
      registrarPintura(idx, claveArista(ax, ay, bx, by));
      muertoIdx = idx;
      muriendo = true;
      avisar("lab.choque");
      pintar();
      tMuerte = setTimeout(() => {
        if (!vivo) return;
        j.x = j.ox;
        j.y = j.oy;
        muriendo = false;
        muertoIdx = null;
        naciendoIdx = idx;
        sinAnim = true;
        pintar();
        tNace = setTimeout(() => {
          if (!vivo) return;
          naciendoIdx = null;
          if (esSolo()) {
            pintar();
            return;
          }
          pasos = 0;
          turno = (idx + 1) % Math.max(1, jugs.length);
          dado = null;
          mostrarTiro("tirar");
          pintar();
        }, 340);
      }, 400);
    };

    /**
     * Pinta el sello emitido al ganar (prueba del misterio).
     * Paints the seal emitted on victory (mystery proof).
     */
    const mostrarSello = (): void => {
      const sello = emitirSello("laberinto");
      if (!sello) return;
      selloOut.textContent = `Sello: ${sello}`;
      selloOut.toggleAttribute("hidden", false);
    };

    /** Captura al pisar el punto: tanto, punto nuevo y a elegir, tirar o fin. / Capture on stepping on the dot: score, fresh dot, then choose, roll or end. */
    const capturar = (): void => {
      const j = jugs[turno] as Jug;
      j.puntos++;
      if (j.puntos >= META) {
        punto = null;
        irA("fin");
        pararReloj();
        avisar(null);
        mostrarSello();
        pintar();
        return;
      }
      punto = colocarPunto(posiciones(), origenes());
      cazaIdx = turno;
      if (tCaza !== null) clearTimeout(tCaza);
      tCaza = setTimeout(() => {
        cazaIdx = null;
        if (!vivo) return;
        fichas.get(turno)?.removeAttribute("data-caza");
      }, 320);
      const sig = resolverCaptura(pasos, esSolo());
      if (sig === "quedar") {
        avisar("lab.punto");
        pintar();
        return;
      }
      mostrarTiro(sig);
      avisar("lab.punto");
      pintar();
    };

    /**
     * Aplica un paso ya validado (mueve, choca o captura).
     * Applies an already validated step (moves, crashes or captures).
     * @param res - Resultado de validarPaso. / validarPaso result.
     */
    const ejecutarPaso = (res: ResultPaso): void => {
      switch (res.kind) {
        case "fuera":
          return;
        case "choque":
          choque(res.ax, res.ay, res.bx, res.by);
          return;
        case "captura": {
          const j = jugs[turno] as Jug;
          j.x = res.nx;
          j.y = res.ny;
          avisar(null);
          capturar();
          return;
        }
        case "ok": {
          const j = jugs[turno] as Jug;
          j.x = res.nx;
          j.y = res.ny;
          avisar(null);
          trasMover();
          return;
        }
      }
    };

    /**
     * Consume un paso tras mover: en solitario repinta; en grupo
     * descuenta y pasa el turno al agotarlos.
     * Consumes a step after moving: solo repaints; group deducts
     * and hands the turn over when exhausted.
     */
    const trasMover = (): void => {
      if (esSolo()) {
        pintar();
        return;
      }
      pasos--;
      if (pasos <= 0) {
        siguienteTurno();
        return;
      }
      pintar();
    };

    /** Intenta un paso ortogonal (pad, tecla o programa). / Tries one orthogonal step (pad, key or code). */
    const intentarPaso = (dx: number, dy: number): void => {
      if (fase !== "pasos" || muriendo) return;
      if (!esSolo() && pasos <= 0) return;
      const j = jugs[turno] as Jug;
      ejecutarPaso(validarPaso(j.x, j.y, dx, dy, muros, punto));
    };

    /**
     * Seguir andando tras capturar (fase elegir).
     * Keep walking after capturing (choose phase).
     */
    const onSeguir = (): void => {
      if (fase !== "elegir" || esSolo() || muriendo) return;
      irA("pasos");
      avisar(null);
      pintar();
    };

    /**
     * Pasar el turno sin pasos restantes.
     * Pass the turn with no steps left.
     */
    const onPasar = (): void => {
      if (fase === "pasos" && !esSolo() && !muriendo && pasos <= 0) siguienteTurno();
    };

    /**
     * Pad direccional: delega en intentarPaso.
     * Directional pad: delegates to intentarPaso.
     * @param e - Clic en el pad. / Pad click.
     */
    const onPad = (e: Event): void => {
      const b = (e.target as Element | null)?.closest?.("[data-dir]") as HTMLElement | null;
      if (!b) return;
      const [dx, dy] = (b.getAttribute("data-dir") ?? "0,0").split(",").map(Number) as [number, number];
      intentarPaso(dx, dy);
    };

    /**
     * Coloca la esquina pendiente en una casilla clicada.
     * Places the pending corner on a clicked cell.
     * @param x - Columna clicada. / Clicked column.
     * @param y - Fila clicada. / Clicked row.
     */
    const colocarEsquina = (x: number, y: number): void => {
      const ei = ESQUINAS.findIndex((o) => o.x === x && o.y === y);
      if (ei < 0) return;
      if (slots.some((o) => o !== pendiente && o.esq === ei)) return;
      if (pendiente === null) return;
      pendiente.esq = ei;
      pendiente = null;
      avisar(null);
      pintar();
    };

    /**
     * Tablero en conf: elige esquina para el hueco pendiente.
     * Board in setup: picks a corner for the pending slot.
     * @param e - Clic en el tablero. / Board click.
     */
    const onTablero = (e: Event): void => {
      if (fase !== "conf" || pendiente === null) return;
      const c = (e.target as Element | null)?.closest?.(".cel") as HTMLElement | null;
      if (!c) return;
      const idx = celdas.indexOf(c);
      if (idx < 0) return;
      colocarEsquina(idx % LADO, Math.floor(idx / LADO));
    };

    /**
     * Vuelve a la configuración limpiando la partida.
     * Back to setup clearing the match.
     */
    const onNueva = (): void => {
      pararReloj();
      pararAnims();
      pararTiros();
      animDado?.cancel();
      animDado = null;
      segundos = 0;
      pendiente = null;
      irA("conf");
      avisar(null);
      pintar();
    };

    const onKey = (e: KeyboardEvent): void => {
      if (e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (esEditable(t)) return;
      const acc = accionTecla(e.key, fase, t?.tagName === "BUTTON");
      switch (acc.kind) {
        case "paso":
          e.preventDefault();
          intentarPaso(acc.dx, acc.dy);
          return;
        case "tirar":
          e.preventDefault();
          tirar();
          return;
        case "nada":
          return;
      }
    };
    /** Al redimensionar: recoloca sin animar. / On resize: repositions without animating. */
    const alRedimensionar = (): void => {
      if (fase === "conf") return;
      sinAnim = true;
      pintarFichas();
    };

    /**
     * Limpieza total: reloj, animaciones, tiros, WAAPI, escuchadores e i18n.
     * Total cleanup: clock, animations, rolls, WAAPI, listeners and i18n.
     */
    const limpiarTodo = (): void => {
      vivo = false;
      if (animDado !== null) {
        animDado.cancel();
        animDado = null;
      }
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", alRedimensionar);
      pararReloj();
      pararAnims();
      pararTiros();
      stopI18n();
    };
    /**
     * Cablea todos los escuchadores (clic, pad, tablero, teclas).
     * Wires every listener (click, pad, board, keys).
     */
    const cablearEventos = (): void => {
      empezarBtn.addEventListener("click", iniciarPartida);
      saltarBtn.addEventListener("click", terminarPrevia);
      dado3dEl.addEventListener("click", tirar);
      seguirBtn.addEventListener("click", onSeguir);
      pasarBtn.addEventListener("click", onPasar);
      pad.addEventListener("click", onPad);
      tablero.addEventListener("click", onTablero);
      revanchaBtn.addEventListener("click", iniciarPartida);
      nuevaBtn.addEventListener("click", onNueva);
      window.addEventListener("resize", alRedimensionar);
      window.addEventListener("keydown", onKey);
    };

    // Cableado. / Wiring.
    armarTablero();
    armarDado();
    pintar();
    cablearEventos();
    onCleanup(limpiarTodo);
  },
});
