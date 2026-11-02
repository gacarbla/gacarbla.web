/**
 * Lógica pura del tres en raya + sus tres niveles.
 * Fácil: al azar. Normal: gana si puede, tapa si debe, si no al azar.
 * Imposible: minimax óptimo con desempate aleatorio: nunca pierde
 * (con juego perfecto el resultado es tablas).
 * Pure tic-tac-toe logic + its three levels.
 * Easy: random. Normal: wins when it can, blocks when it must, else random.
 * Impossible: optimal minimax with random tie-break: never loses
 * (with perfect play the result is a draw).
 */

/** Marca de un bando. / Side mark. */
export type Marca = "X" | "O";
/** Contenido de una casilla. / Cell content. */
export type Casilla = Marca | null;

/** El otro bando. / The other side. */
export function otra(m: Marca): Marca {
  return m === "X" ? "O" : "X";
}

/** Las 8 líneas. / The 8 lines. */
const LINEAS: Array<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Línea ganadora o null. / Winning line or null.
 */
export function lineaGanadora(tablero: readonly Casilla[]): readonly [number, number, number] | null {
  for (const l of LINEAS) {
    const [a, b, c] = l;
    if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) return l;
  }
  return null;
}

/**
 * Índices libres. / Free indices.
 */
export function libres(tablero: readonly Casilla[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (!tablero[i]) out.push(i);
  return out;
}

/**
 * Baraja sin sesgo (Fisher-Yates). / Unbiased shuffle (Fisher-Yates).
 */
function barajar<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/**
 * Solo el final: línea ganadora o tablas (nada de ramas de juego).
 * Terminals only: winning line or draw (no game branches).
 * @param tablero - Tablero en juego. / Board in play.
 * @param yo - Bando propio. / Own side.
 * @param prof - Profundidad. / Depth.
 * @returns Centésimas a favor de `yo`, o null si no terminó. / Hundredths in `yo`'s favor, or null when not over.
 */
function evalua(tablero: Casilla[], yo: Marca, prof: number): number | null {
  const g = lineaGanadora(tablero);
  if (g) return tablero[g[0]] === yo ? 10 - prof : prof - 10;
  if (libres(tablero).length === 0) return 0;
  return null;
}

/**
 * Turno propio: maximiza con su mitad de la poda alfa-beta.
 * Own turn: maximizes with its half of alpha-beta pruning.
 * @param tablero - Tablero en juego. / Board in play.
 * @param yo - Bando propio. / Own side.
 * @param turno - Bando que mueve. / Side to move.
 * @param prof - Profundidad. / Depth.
 * @param alfa - Mejor valor propio. / Own best value.
 * @param beta - Mejor valor rival. / Rival best value.
 * @returns Mejor valor para `yo`. / Best value for `yo`.
 */
function maximiza(tablero: Casilla[], yo: Marca, turno: Marca, prof: number, alfa: number, beta: number): number {
  let v = -Infinity;
  const mv = libres(tablero);
  for (const m of mv) {
    tablero[m] = turno;
    v = Math.max(v, minimax(tablero, yo, otra(turno), prof + 1, alfa, beta));
    tablero[m] = null;
    alfa = Math.max(alfa, v);
    if (beta <= alfa) break;
  }
  return v;
}

/**
 * Turno rival: minimiza con su mitad de la poda alfa-beta.
 * Rival turn: minimizes with its half of alpha-beta pruning.
 * @param tablero - Tablero en juego. / Board in play.
 * @param yo - Bando propio. / Own side.
 * @param turno - Bando que mueve. / Side to move.
 * @param prof - Profundidad. / Depth.
 * @param alfa - Mejor valor propio. / Own best value.
 * @param beta - Mejor valor rival. / Rival best value.
 * @returns Peor valor para `yo`. / Worst value for `yo`.
 */
function minimiza(tablero: Casilla[], yo: Marca, turno: Marca, prof: number, alfa: number, beta: number): number {
  let v = Infinity;
  const mv = libres(tablero);
  for (const m of mv) {
    tablero[m] = turno;
    v = Math.min(v, minimax(tablero, yo, otra(turno), prof + 1, alfa, beta));
    tablero[m] = null;
    beta = Math.min(beta, v);
    if (beta <= alfa) break;
  }
  return v;
}

/**
 * Minimax con poda alfa-beta. Gana pronto y pierde tarde.
 * Minimax with alpha-beta pruning. Wins soon and loses late.
 * @returns Centésimas a favor de `yo`. / Hundredths in `yo`'s favor.
 */
function minimax(tablero: Casilla[], yo: Marca, turno: Marca, prof: number, alfa: number, beta: number): number {
  const fin = evalua(tablero, yo, prof);
  if (fin !== null) return fin;
  if (turno === yo) return maximiza(tablero, yo, turno, prof, alfa, beta);
  return minimiza(tablero, yo, turno, prof, alfa, beta);
}

/**
 * Candidatos barajados para el desempate al azar.
 * Shuffled candidates for the random tie-break.
 * @param tablero - Tablero en juego. / Board in play.
 * @param rnd - Azar. / Random source.
 * @returns Casillas libres en orden aleatorio. / Free cells in random order.
 */
function ordenaCandidatos(tablero: Casilla[], rnd: () => number): number[] {
  return barajar(libres(tablero), rnd);
}

/**
 * Elige el candidato con mejor valor minimax.
 * Picks the candidate with the best minimax value.
 * @param tablero - Tablero en juego. / Board in play.
 * @param yo - Bando propio. / Own side.
 * @param candidatos - Casillas a probar. / Cells to try.
 * @returns La mejor casilla. / The best cell.
 */
function eligeMejor(tablero: Casilla[], yo: Marca, candidatos: number[]): number {
  let mejor = candidatos[0] as number;
  let mejorV = -Infinity;
  for (const m of candidatos) {
    tablero[m] = yo;
    const v = minimax(tablero, yo, otra(yo), 0, -Infinity, Infinity);
    tablero[m] = null;
    if (v > mejorV) {
      mejorV = v;
      mejor = m;
    }
  }
  return mejor;
}

/**
 * Mejor jugada óptima (imposible). Desempata al azar entre iguales.
 * Optimal best move (impossible). Random tie-break among equals.
 */
export function mejorJugada(tablero: Casilla[], yo: Marca, rnd: () => number = Math.random): number {
  return eligeMejor(tablero, yo, ordenaCandidatos(tablero, rnd));
}

/**
 * Jugada normal: gana si puede, tapa si debe, si no al azar.
 * Normal move: wins when it can, blocks when it must, else random.
 */
export function jugadaNormal(tablero: Casilla[], yo: Marca, rnd: () => number = Math.random): number {
  const rival = otra(yo);
  const mv = libres(tablero);
  for (const m of mv) {
    tablero[m] = yo;
    const gana = lineaGanadora(tablero) !== null;
    tablero[m] = null;
    if (gana) return m;
  }
  for (const m of mv) {
    tablero[m] = rival;
    const tapa = lineaGanadora(tablero) !== null;
    tablero[m] = null;
    if (tapa) return m;
  }
  return mv[Math.floor(rnd() * mv.length)] as number;
}

/**
 * Jugada fácil: al azar. / Easy move: random.
 */
export function jugadaFacil(tablero: Casilla[], rnd: () => number = Math.random): number {
  const mv = libres(tablero);
  return mv[Math.floor(rnd() * mv.length)] as number;
}

/**
 * Elige según el nivel 0/1/2. / Picks by level 0/1/2.
 */
export function jugadaNivel(tablero: Casilla[], yo: Marca, nivel: number, rnd: () => number = Math.random): number {
  if (nivel <= 0) return jugadaFacil(tablero, rnd);
  if (nivel === 1) return jugadaNormal(tablero, yo, rnd);
  return mejorJugada(tablero, yo, rnd);
}
