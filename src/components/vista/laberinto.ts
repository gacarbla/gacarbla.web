import type { Tinta } from "./cubo.js";

/**
 * Mini-animación del Laberinto para la ficha de la sala: la ficha elige
 * un punto al azar, lo caza por el camino más corto (BFS) esquivando los
 * muros — que NO se dibujan (son invisibles, como en el juego) — y al
 * llegar aparece otro punto. Con estado (la patrulla tiene memoria).
 * Mini-animation of the Maze for the arcade card: the token picks a
 * random dot, hunts it down the shortest path (BFS) dodging the walls
 * — which are NOT drawn (invisible, like in the game) — and on arrival
 * another dot appears. Stateful (the patrol has memory).
 */

/** Lado de la mini-retícula. / Mini-grid side. */
const LADO = 7;
/** Casillas por segundo. / Cells per second. */
const VEL = 2.6;

/** Celda. / Cell. */
interface Celda {
  x: number;
  y: number;
}

/** Direcciones cardinales. / Cardinal directions. */
const DIRS: Array<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * ¿Casilla dentro de la mini-retícula? / Is the cell inside the mini-grid?
 * @param x - Columna. / Column.
 * @param y - Fila. / Row.
 * @returns True si está dentro. / True when inside.
 */
function dentro(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < LADO && y < LADO;
}

/**
 * Azar determinista por arista (muros estables). / Deterministic per-edge randomness (stable walls).
 */
function azar(x: number, y: number, d: number): number {
  let n = (x * 374761393 + y * 668265263 + d * 2246822519) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/**
 * ¿Hay muro entre esas casillas vecinas? / Is there a wall between those neighboring cells?
 */
function hayMuro(ax: number, ay: number, bx: number, by: number): boolean {
  if (bx === ax + 1) return azar(ax, ay, 1) < 0.16;
  if (bx === ax - 1) return azar(bx, by, 1) < 0.16;
  if (by === ay + 1) return azar(ax, ay, 2) < 0.16;
  return azar(ax, by, 2) < 0.16;
}

/**
 * Vecinas abiertas: dentro y sin muro.
 * Open neighbors: inside and wall-free.
 * @param c - Casilla origen. / Source cell.
 * @returns Vecinas transitables. / Walkable neighbors.
 */
function vecinasAbiertas(c: Celda): Celda[] {
  const out: Celda[] = [];
  for (const [dx, dy] of DIRS) {
    const nx = c.x + dx;
    const ny = c.y + dy;
    if (!dentro(nx, ny)) continue;
    if (hayMuro(c.x, c.y, nx, ny)) continue;
    out.push({ x: nx, y: ny });
  }
  return out;
}

/**
 * Reconstruye la ruta desde el mapa de previos.
 * Rebuilds the route from the prev map.
 * @param prev - Mapa celda -> anterior. / Cell -> previous map.
 * @param dest - Destino. / Target.
 * @returns Casillas hasta el destino sin la salida. / Cells to the target without the start.
 */
function reconstruir(prev: Map<string, string | null>, dest: Celda): Celda[] {
  const ruta: Celda[] = [];
  let k: string | null = `${dest.x},${dest.y}`;
  while (k) {
    const [x, y] = k.split(",").map(Number) as [number, number];
    ruta.unshift({ x, y });
    k = prev.get(k) ?? null;
  }
  ruta.shift();
  return ruta;
}

/**
 * Camino más corto (BFS) sin contar la salida. / Shortest path (BFS) without the start.
 * @returns Casillas hasta el destino o null. / Cells to the target or null.
 */
function camino(sx: number, sy: number, tx: number, ty: number): Celda[] | null {
  const prev = new Map<string, string | null>([[`${sx},${sy}`, null]]);
  const cola: Celda[] = [{ x: sx, y: sy }];
  while (cola.length > 0) {
    const c = cola.shift() as Celda;
    if (c.x === tx && c.y === ty) return reconstruir(prev, { x: tx, y: ty });
    for (const v of vecinasAbiertas(c)) {
      const k = `${v.x},${v.y}`;
      if (prev.has(k)) continue;
      prev.set(k, `${c.x},${c.y}`);
      cola.push(v);
    }
  }
  return null;
}

/** Manhattan. */
function dist(a: Celda, b: Celda): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Vista en marcha. / Running preview. */
export interface VistaLab {
  /**
   * Avanza y pinta un fotograma. / Advances and paints one frame.
   * @param dt - Segundos desde el anterior. / Seconds since the previous one.
   */
  dibujar(g: CanvasRenderingContext2D, w: number, h: number, dt: number, c: Tinta): void;
}

/**
 * Crea la patrulla (empieza en la esquina con un punto puesto).
 * Creates the patrol (starts at the corner with a dot placed).
 */
export function crearLaberinto(): VistaLab {
  let px = 0.5;
  let py = 0.5;
  let ruta: Celda[] = [];
  let ox = 3;
  let oy = 3;
  let t = 0;

  /**
   * Busca un punto cazable (lejos y con camino) hasta N intentos.
   * Looks for a huntable dot (far and pathed) within N tries.
   * @param intentos - Pruebas. / Tries.
   * @returns True si fijó objetivo y camino. / True when target and path were set.
   */
  const buscaObjetivo = (intentos: number): boolean => {
    const aqui = { x: Math.floor(px), y: Math.floor(py) };
    for (let i = 0; i < intentos; i++) {
      const c = { x: Math.floor(Math.random() * LADO), y: Math.floor(Math.random() * LADO) };
      if (dist(aqui, c) < 2) continue;
      const r = camino(aqui.x, aqui.y, c.x, c.y);
      if (!r || r.length === 0) continue;
      ox = c.x;
      oy = c.y;
      ruta = r;
      return true;
    }
    return false;
  };

  /**
   * Repliegue a una vecina abierta (o se queda quieta).
   * Fallback to an open neighbor (or stays put).
   */
  const repliegueAVecina = (): void => {
    const aqui = { x: Math.floor(px), y: Math.floor(py) };
    for (const [dx, dy] of DIRS) {
      const nx = aqui.x + dx;
      const ny = aqui.y + dy;
      if (!dentro(nx, ny)) continue;
      if (hayMuro(aqui.x, aqui.y, nx, ny)) continue;
      ox = nx;
      oy = ny;
      ruta = [{ x: nx, y: ny }];
      return;
    }
    ox = aqui.x;
    oy = aqui.y;
    ruta = [];
  };

  /** Elige un punto cazable y su camino. / Picks a huntable dot and its path. */
  const elegir = (): void => {
    if (buscaObjetivo(60)) return;
    // Sin objetivo a mano: a una vecina abierta o se queda. / No handy target: to an open neighbor or stays.
    repliegueAVecina();
  };
  elegir();

  /**
   * Avanza la ficha por el camino (al llegar, otro punto).
   * Moves the token along the path (on arrival, another dot).
   * @param dt - Segundos desde el anterior. / Seconds since the previous one.
   */
  const avanzar = (dt: number): void => {
    // Avanza por el camino; al llegar, otro punto. / Walks the path; on arrival, another dot.
    let queda = VEL * Math.min(0.05, Math.max(0, dt));
    while (queda > 0) {
      if (ruta.length === 0) elegir();
      const s = ruta[0];
      if (!s) break;
      const tx = s.x + 0.5;
      const ty = s.y + 0.5;
      const dx = tx - px;
      const dy = ty - py;
      const d = Math.hypot(dx, dy);
      if (d <= queda) {
        px = tx;
        py = ty;
        queda -= d;
        ruta.shift();
        if (ruta.length === 0) elegir();
      } else {
        px += (dx / d) * queda;
        py += (dy / d) * queda;
        queda = 0;
      }
    }
  };

  /**
   * Pinta la retícula (los muros no se ven).
   * Paints the grid (walls are unseen).
   * @param g - Contexto 2D. / 2D context.
   * @param w - Ancho. / Width.
   * @param h - Alto. / Height.
   * @param c - Colores. / Colors.
   */
  const pintarReticula = (g: CanvasRenderingContext2D, w: number, h: number, c: Tinta): void => {
    // Retícula (los muros no se ven). / Grid (walls are unseen).
    const n = LADO;
    g.clearRect(0, 0, w, h);
    g.strokeStyle = c.tinta;
    g.globalAlpha = 0.18;
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      g.moveTo((i * w) / n, 0);
      g.lineTo((i * w) / n, h);
      g.moveTo(0, (i * h) / n);
      g.lineTo(w, (i * h) / n);
    }
    g.stroke();
    g.globalAlpha = 1;
  };

  /**
   * Pinta el punto que palpita. / Paints the throbbing dot.
   * @param g - Contexto 2D. / 2D context.
   * @param w - Ancho. / Width.
   * @param h - Alto. / Height.
   * @param c - Colores (no usados, el punto es ámbar). / Colors (unused, the dot is amber).
   */
  const pintarPunto = (g: CanvasRenderingContext2D, w: number, h: number, c: Tinta): void => {
    void c;
    // Punto que palpita. / Throbbing dot.
    const cw = w / LADO;
    const chh = h / LADO;
    const r = Math.min(cw, chh) * (0.22 + 0.05 * Math.sin(t * 4));
    g.save();
    g.translate((ox + 0.5) * cw, (oy + 0.5) * chh);
    g.rotate(Math.PI / 4);
    g.fillStyle = "#e6a817";
    g.fillRect(-r, -r, r * 2, r * 2);
    g.restore();
  };

  /**
   * Pinta la ficha. / Paints the token.
   * @param g - Contexto 2D. / 2D context.
   * @param w - Ancho. / Width.
   * @param h - Alto. / Height.
   * @param c - Colores. / Colors.
   */
  const pintarFicha = (g: CanvasRenderingContext2D, w: number, h: number, c: Tinta): void => {
    // Ficha. / Token.
    const cw = w / LADO;
    const chh = h / LADO;
    g.fillStyle = c.acento;
    g.beginPath();
    g.arc(px * cw, py * chh, Math.min(cw, chh) * 0.3, 0, Math.PI * 2);
    g.fill();
  };

  return {
    dibujar(g, w, h, dt, c) {
      t += Math.max(0, dt);
      avanzar(dt);
      pintarReticula(g, w, h, c);
      pintarPunto(g, w, h, c);
      pintarFicha(g, w, h, c);
    },
  };
}
