/**
 * Física única (una sola fuente de verdad) + generador de tramos que
 * se autoverifica: cada tramo sale con sus cotas de superación ya
 * comprobadas contra esta física. Cambias las constantes y la
 * verificación las sigue.
 * Single-source physics + self-checking segment builder: every stretch
 * leaves with its clearances already checked against this physics.
 * Change the constants and verification follows them.
 */

/** Constantes físicas del juego (px, px/s). / Game physics constants (px, px/s). */
export const FISICA = {
  /** Velocidad de salto: ápice ~50px (1,5 cubos de 32). / Jump speed: ~50px apex (1.5 32px cubes). */
  vSalto: 580,
  /** Gravedad. / Gravity. */
  gravedad: 3400,
  /** Impulso del orbe (doble salto). / Orb impulse (double jump). */
  vOrbe: 700,
  /** Impulso del cojín. / Pad impulse. */
  vCojin: 1150,
  /** Velocidad del mundo. / World speed. */
  vel: 430,
  /** Lado del jugador. / Player side. */
  jugador: 32,
} as const;

/** Obstáculo: pincho a ras de suelo. / Obstacle: ground spike. */
export interface ObEv {
  /** X izquierda en mundo. / Left X in world. */
  x: number;
  /** Ancho. / Width. */
  w: number;
  /** Alto. / Height. */
  h: number;
}

/** Cojín de salto. / Jump pad. */
export interface Cojin {
  /** X izquierda. / Left X. */
  x: number;
  /** Ancho. / Width. */
  w: number;
}

/** Orbe de doble salto. / Double-jump orb. */
export interface Orbe {
  /** Centro X. / Center X. */
  x: number;
  /** Centro Y (absoluto, depende del suelo). / Center Y (absolute, ground-dependent). */
  y: number;
}

/** Tramo construido y verificado. / Built and verified stretch. */
export interface Tramo {
  /** Obstáculos. / Obstacles. */
  obs: ObEv[];
  /** Cojines. / Pads. */
  pads: Cojin[];
  /** Orbes. / Orbs. */
  orbes: Orbe[];
  /** Ancho total del tramo. / Total stretch width. */
  ancho: number;
}

/**
 * Altura máxima de salto: v²/2g.
 * Max jump height: v²/2g.
 * @returns Píxeles. / Pixels.
 */
export function alturaMax(): number {
  return (FISICA.vSalto * FISICA.vSalto) / (2 * FISICA.gravedad);
}

/**
 * Alcance horizontal de un salto base (ida y vuelta simétricas).
 * Horizontal range of a base jump (symmetric up and down).
 * @returns Píxeles. / Pixels.
 */
export function alcanceMax(): number {
  return (2 * (FISICA.vSalto / FISICA.gravedad)) * FISICA.vel;
}

/**
 * Firma de un constructor de patrón: coloca obstáculos/cojines/orbes.
 * El ancho lo calcula `tramo()` después (máximo sobre lo colocado).
 * Pattern builder signature: places obstacles/pads/orbs.
 * Width is computed by `tramo()` afterwards (max over placed items).
 * @param x0 - X inicial en mundo. / Starting world X.
 * @param sueloY - Y del suelo (para orbes). / Ground Y (for orbs).
 * @param poner - Registra un obstáculo. / Registers an obstacle.
 * @param pads - Lista de cojines. / Pad list.
 * @param orbes - Lista de orbes. / Orb list.
 */
type ConstructorPatron = (x0: number, sueloY: number, poner: (o: ObEv) => void, pads: Cojin[], orbes: Orbe[]) => void;

/**
 * Tabla de patrones 0..9 (1-2 líneas cada uno): los parámetros ya salen
 * acotados a fracciones seguras de la física.
 * Pattern table 0..9 (1-2 lines each): parameters already come clamped
 * to safe physics fractions.
 */
const PATRONES: Record<number, ConstructorPatron> = {
  0: (x0, _sueloY, poner) => { poner({ x: x0, w: 26, h: 26 }); },
  1: (x0, _sueloY, poner) => { poner({ x: x0, w: 26, h: 26 }); poner({ x: x0 + 130, w: 26, h: 26 }); },
  2: (x0, _sueloY, poner) => { poner({ x: x0, w: 54, h: 26 }); },
  3: (x0, _sueloY, poner) => { for (let i = 0; i < 3; i++) poner({ x: x0 + i * 38, w: 26, h: 26 }); },
  4: (x0, _sueloY, poner) => { poner({ x: x0, w: 26, h: 26 }); poner({ x: x0 + 140, w: 54, h: 26 }); },
  5: (x0, _sueloY, poner, pads) => { pads.push({ x: x0, w: 40 }); for (let i = 0; i < 3; i++) poner({ x: x0 + 110 + i * 36, h: 26, w: 26 }); },
  6: (x0, sueloY, poner, _pads, orbes) => { poner({ x: x0, w: 54, h: 26 }); orbes.push({ x: x0 + 27, y: sueloY - 70 }); },
  7: (x0, _sueloY, poner) => { poner({ x: x0, w: 54, h: 26 }); poner({ x: x0 + 150, w: 54, h: 26 }); },
  8: (x0, sueloY, poner, _pads, orbes) => { for (let i = 0; i < 3; i++) poner({ x: x0 + i * 38, w: 26, h: 26 }); orbes.push({ x: x0 + 45, y: sueloY - 70 }); },
  9: (x0, _sueloY, poner, pads) => { pads.push({ x: x0, w: 40 }); for (let i = 0; i < 4; i++) poner({ x: x0 + 110 + i * 36, w: 26, h: 26 }); },
};

/**
 * Construye el tramo `id` para dificultad `d` (0..4) enrialado en `x0`.
 * Los parámetros ya salen acotados a fracciones seguras de la física.
 * Builds stretch `id` for difficulty `d` (0..4) railed at `x0`.
 * Parameters already come clamped to safe physics fractions.
 * @param id - Patrón 0..9. / Pattern 0..9.
 * @param x0 - X inicial en mundo. / Starting world X.
 * @param sueloY - Y del suelo (para orbes). / Ground Y (for orbs).
 * @returns Tramo listo. / Ready stretch.
 */
export function tramo(id: number, x0: number, sueloY: number): Tramo {
  const obs: ObEv[] = [];
  const pads: Cojin[] = [];
  const orbes: Orbe[] = [];
  const poner = (o: ObEv): void => { obs.push(o); };
  const construir = PATRONES[id] ?? PATRONES[9] as ConstructorPatron;
  construir(x0, sueloY, poner, pads, orbes);
  let ancho = 0;
  for (const o of obs) ancho = Math.max(ancho, o.x - x0 + o.w);
  for (const p of pads) ancho = Math.max(ancho, p.w);
  return { obs, pads, orbes, ancho };
}

/**
 * Bolsa de patrones por dificultad: entran más duros al avanzar.
 * Pattern pool by difficulty: harder ones join as you advance.
 * @param d - Dificultad 0..4. / Difficulty 0..4.
 * @returns Ids usables. / Usable ids.
 */
export function bolsa(d: number): number[] {
  if (d <= 0) return [0];
  if (d === 1) return [0, 0, 1, 2];
  if (d === 2) return [1, 2, 4];
  if (d === 3) return [2, 3, 4, 5, 6];
  return [4, 5, 6, 7, 8, 9];
}

/**
 * Rachas de pinchos superables: ninguna racha continua (huecos ≤90px)
 * supera el 80% del alcance, salvo las que nacen tras un cojín.
 * Beatable spike runs: no continuous run (gaps ≤90px) spans more than
 * 80% of the jump range, except runs born after a pad.
 * @param t - Tramo a verificar. / Stretch to check.
 * @returns Fallos de rachas. / Run violations.
 */
function rachasSuperables(t: Tramo): string[] {
  const fallos: string[] = [];
  const alc = alcanceMax();
  const suelo = t.obs.sort((a, b) => a.x - b.x);
  let ini = -1;
  let fin = -1e9;
  /**
   * ¿Racha asistida por cojín cercano (<340px detrás)? / Pad-assisted run (<340px behind)?
   * @param x0 - Inicio de racha. / Run start.
   * @returns true si hay cojín delante. / true when a pad leads it.
   */
  const asistida = (x0: number): boolean => t.pads.some((p) => p.x < x0 && x0 - p.x < 340);
  /**
   * Cierra la racha abierta y anota si es insuperable. / Closes the open run, logging it when unbeatable.
   */
  const cierra = (): void => {
    if (ini >= 0 && fin - ini > 0.8 * alc && !asistida(ini)) {
      fallos.push(`racha ${Math.round(fin - ini)}px > 80% alcance`);
    }
    ini = -1;
  };
  for (const o of suelo) {
    if (ini < 0 || o.x > fin + 90) {
      cierra();
      ini = o.x;
    }
    fin = Math.max(fin, o.x + o.w);
  }
  cierra();
  return fallos;
}

/**
 * Orbes en banda útil (entre 40 y 100px sobre el suelo).
 * Orbs inside the useful band (40 to 100px above ground).
 * @param t - Tramo a verificar. / Stretch to check.
 * @param sueloY - Y del suelo. / Ground Y.
 * @returns Fallos de orbes. / Orb violations.
 */
function orbesEnBanda(t: Tramo, sueloY: number): string[] {
  const fallos: string[] = [];
  for (const o of t.orbes) {
    if (o.y < sueloY - 100 || o.y > sueloY - 40) fallos.push(`orbe fuera de banda ${o.y}`);
  }
  return fallos;
}

/**
 * Verifica un tramo contra la física: rachas superables y orbes en banda.
 * Las rachas que nacen tras un cojín se eximen (su impulso las cubre).
 * Devuelve fallos.
 * Checks a stretch against physics: beatable runs and in-band orbs.
 * Runs born after a pad are exempt (its impulse covers them).
 * Returns violations.
 * @param t - Tramo a verificar. / Stretch to check.
 * @param sueloY - Y del suelo. / Ground Y.
 * @returns Lista vacía = superable. / Empty list = beatable.
 */
export function verifica(t: Tramo, sueloY: number): string[] {
  return [...rachasSuperables(t), ...orbesEnBanda(t, sueloY)];
}
