/**
 * Rejilla + muros del laberinto invisible.
 * Los muros viven en las ARISTAS entre casillas adyacentes (no en las
 * casillas). Se generan 25 al azar con greedy + BFS: solo se conserva
 * el muro si el grafo sigue conexo, así que toda casilla es alcanzable
 * desde toda esquina. Como el complemento de un árbol generador tiene
 * 36 aristas quitables, el greedy siempre llega a 25.
 * Grid + walls of the invisible maze.
 * Walls live on EDGES between adjacent cells (not on cells). 25 are
 * drawn greedily + BFS: a wall only stays when the graph stays
 * connected, so every cell is reachable from every corner. Since a
 * spanning-tree complement holds 36 removable edges, greedy always
 * reaches 25.
 */

/** Celda de la rejilla. / Grid cell. */
export interface Celda {
  /** Columna 0..lado-1. / Column 0..side-1. */
  x: number;
  /** Fila 0..lado-1. / Row 0..side-1. */
  y: number;
}

/** Lado de la rejilla. / Grid side. */
export const LADO = 7;

/**
 * Clave canónica de la arista entre dos casillas vecinas.
 * Canonical key of the edge between two neighboring cells.
 */
function clave(ax: number, ay: number, bx: number, by: number): string {
  return ax < bx || (ax === bx && ay < by) ? `${ax},${ay}|${bx},${by}` : `${bx},${by}|${ax},${ay}`;
}

/**
 * ¿Hay muro entre esas dos casillas vecinas?
 * Is there a wall between those two neighboring cells?
 */
export function hayMuro(muros: ReadonlySet<string>, ax: number, ay: number, bx: number, by: number): boolean {
  return muros.has(clave(ax, ay, bx, by));
}

/** Direcciones ortogonales. / Orthogonal directions. */
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * ¿Dentro del tablero? / Inside the board?
 */
function dentro(nx: number, ny: number, lado: number): boolean {
  return nx >= 0 && ny >= 0 && nx < lado && ny < lado;
}

/**
 * Vecinas alcanzables en un paso (dentro y sin muro).
 * Reachable neighbors in one step (inside and wall-free).
 */
function vecinasAbiertas(c: Celda, muros: ReadonlySet<string>, lado: number): Celda[] {
  const out: Celda[] = [];
  for (const [dx, dy] of DIRS) {
    const nx = c.x + dx;
    const ny = c.y + dy;
    if (!dentro(nx, ny, lado) || hayMuro(muros, c.x, c.y, nx, ny)) continue;
    out.push({ x: nx, y: ny });
  }
  return out;
}

/**
 * ¿El grafo sigue conexo sin contar esos muros? (BFS desde 0,0.)
 * Is the graph still connected ignoring those walls? (BFS from 0,0.)
 */
function conexo(muros: ReadonlySet<string>, lado: number): boolean {
  const vistos = new Set<string>(["0,0"]);
  const cola: Celda[] = [{ x: 0, y: 0 }];
  while (cola.length > 0) {
    const c = cola.pop() as Celda;
    for (const n of vecinasAbiertas(c, muros, lado)) {
      const k = `${n.x},${n.y}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      cola.push(n);
    }
  }
  return vistos.size === lado * lado;
}

/**
 * Todas las aristas internas (candidatas a muro).
 * All inner edges (wall candidates).
 */
function todasLasAristas(lado: number): Array<[number, number, number, number]> {
  const aristas: Array<[number, number, number, number]> = [];
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      if (x + 1 < lado) aristas.push([x, y, x + 1, y]);
      if (y + 1 < lado) aristas.push([x, y, x, y + 1]);
    }
  }
  return aristas;
}

/**
 * Baraja sin sesgo (Fisher-Yates).
 * Unbiased shuffle (Fisher-Yates).
 * @param a - Lista a barajar (se modifica). / List to shuffle (modified in place).
 * @param rnd - Azar inyectable. / Injectable randomness.
 */
function barajar<T>(a: T[], rnd: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/**
 * Genera `total` muros conexos por greedy barajado.
 * Generates `total` connected walls via shuffled greedy.
 * @param total - Muros a colocar. / Walls to place.
 * @param lado - Lado de la rejilla. / Grid side.
 * @param rnd - Azar inyectable (tests). / Injectable randomness (tests).
 */
export function generarMuros(total = 25, lado = LADO, rnd: () => number = Math.random): Set<string> {
  const aristas = barajar(todasLasAristas(lado), rnd);
  const muros = new Set<string>();
  for (const [ax, ay, bx, by] of aristas) {
    if (muros.size >= total) break;
    const k = clave(ax, ay, bx, by);
    muros.add(k);
    if (!conexo(muros, lado)) muros.delete(k);
  }
  return muros;
}

/** Manhattan entre celdas. / Manhattan between cells. */
export function manhattan(a: Celda, b: Celda): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * ¿La casilla está ocupada? / Is the cell taken?
 */
function estaOcupada(ocupadas: readonly Celda[], x: number, y: number): boolean {
  return ocupadas.some((o) => o.x === x && o.y === y);
}

/**
 * Casilla uniforme al azar. / Uniform random cell.
 */
function casillaAlAzar(lado: number, rnd: () => number): Celda {
  return { x: Math.floor(rnd() * lado), y: Math.floor(rnd() * lado) };
}

/**
 * Muestrea hasta dar con una casilla que cumpla el predicado.
 * Samples until a cell meets the predicate.
 * @returns La casilla o null si se agotan los intentos. / The cell or null when attempts run out.
 */
function muestrear(pred: (c: Celda) => boolean, lado: number, rnd: () => number, intentos: number): Celda | null {
  for (let i = 0; i < intentos; i++) {
    const c = casillaAlAzar(lado, rnd);
    if (pred(c)) return c;
  }
  return null;
}

/**
 * Primera casilla libre por filas (red de seguridad).
 * First free cell by rows (safety net).
 */
function primeraLibre(ocupadas: readonly Celda[], lado: number): Celda {
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      if (!estaOcupada(ocupadas, x, y)) return { x, y };
    }
  }
  return { x: Math.floor(lado / 2), y: Math.floor(lado / 2) };
}

/**
 * Coloca el punto: casilla libre, sin jugadores a Manhattan ≤1 y a
 * Manhattan >1 de toda esquina de origen ocupada. Con red de
 * seguridad por si el tablero estuviera imposible.
 * Places the dot: free cell, no players at Manhattan ≤1 and at
 * Manhattan >1 from every taken origin corner. With fallbacks in
 * case the board were impossible.
 * @param ocupadas - Casillas con jugador. / Cells holding a player.
 * @param origenes - Esquinas de origen ocupadas. / Taken origin corners.
 * @param lado - Lado de la rejilla. / Grid side.
 * @param rnd - Azar inyectable. / Injectable randomness.
 */
export function colocarPunto(
  ocupadas: readonly Celda[],
  origenes: readonly Celda[],
  lado = LADO,
  rnd: () => number = Math.random,
): Celda {
  const libre = (c: Celda): boolean => !estaOcupada(ocupadas, c.x, c.y);
  const estricta = (c: Celda): boolean =>
    libre(c) &&
    ocupadas.every((o) => manhattan(c, o) > 1) &&
    origenes.every((o) => manhattan(c, o) > 1);
  const sinOrigen = (c: Celda): boolean => libre(c) && ocupadas.every((o) => manhattan(c, o) > 1);
  return (
    muestrear(estricta, lado, rnd, 500) ?? muestrear(sinOrigen, lado, rnd, 500) ?? primeraLibre(ocupadas, lado)
  );
}
