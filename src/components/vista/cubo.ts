/**
 * Mini-animación del Cubo corredor para la ficha de la sala: suelo que
 * desfila, pinchos que entran por la derecha y cubo que salta SOLO para
 * librarlos. Los pinchos van faseados con el salto (siempre libra).
 * Sin estado: todo es función pura del tiempo (el componente posee el bucle).
 * Mini-animation of the Runner cube for the arcade card: parading
 * ground, spikes coming from the right and a cube that jumps ONLY to
 * clear them. Spikes are phased with the jump (it always clears).
 * Stateless: everything is a pure function of time (the component owns the loop).
 */

/** Colores leídos una vez por arranque. / Colors read once per start. */
export interface Tinta {
  tinta: string;
  acento: string;
}

/**
 * Lee los colores del tema. / Reads the theme colors.
 */
export function leerTinta(): Tinta {
  const cs = getComputedStyle(document.documentElement);
  return {
    tinta: cs.getPropertyValue("--ink").trim() || "#17150f",
    acento: cs.getPropertyValue("--accent").trim() || "#b3541e",
  };
}

/** Periodo entre saltos (s). / Time between jumps (s). */
const PERIODO = 1.6;
/** Duración del salto (s). / Jump duration (s). */
const AIRE = 0.82;
/** El morro del pincho llega justo tras despegar (s). / The spike front arrives just after takeoff (s). */
const LLEGADA = 0.12;
/** Ancho del pincho (px). / Spike width (px). */
const ANCHO_PINCHO = 18;

/**
 * Altura pseudoaleatoria 0..1 del pincho k. / Pseudorandom 0..1 height of spike k.
 */
function alturaPincho(k: number): number {
  const n = Math.sin(k * 127.1) * 43758.5453;
  const f = n - Math.floor(n);
  return f < 0 ? f + 1 : f;
}

/**
 * Fase del salto en `t` (despegue en cada múltiplo del periodo).
 * Jump phase at `t` (takeoff on every period multiple).
 * @param t - Segundos (bucle). / Seconds (looping).
 * @param h - Alto lógico. / Logical height.
 * @returns Altura, progreso y si está en el aire. / Height, progress and whether airborne.
 */
function faseSalto(t: number, h: number): { altura: number; k: number; enAire: boolean } {
  const p = (((t % PERIODO) + PERIODO) % PERIODO) / PERIODO;
  const enAire = p * PERIODO < AIRE;
  const k = enAire ? (p * PERIODO) / AIRE : 0;
  const altura = enAire ? Math.sin(k * Math.PI) * h * 0.36 : 0;
  return { altura, k, enAire };
}

/**
 * Pinta el suelo y sus marcas de velocidad.
 * Paints the ground and its speed marks.
 * @param g - Contexto 2D. / 2D context.
 * @param w - Ancho lógico. / Logical width.
 * @param sueloY - Altura del suelo. / Ground height.
 * @param t - Segundos (bucle). / Seconds (looping).
 * @param vel - Velocidad de desfile. / Parade speed.
 * @param c - Colores. / Colors.
 */
function pintarSuelo(g: CanvasRenderingContext2D, w: number, sueloY: number, t: number, vel: number, c: Tinta): void {
  // Suelo + marcas de velocidad. / Ground + speed marks.
  g.fillStyle = c.tinta;
  g.globalAlpha = 0.55;
  g.fillRect(0, sueloY, w, 2);
  g.globalAlpha = 0.25;
  const off = (t * vel) % 44;
  for (let x = -off; x < w; x += 44) g.fillRect(x, sueloY + 6, 18, 2);
  g.globalAlpha = 1;
}

/**
 * Pinta los pinchos faseados con el salto (el cubo libra siempre).
 * Paints the spikes phased with the jump (the cube always clears).
 * @param g - Contexto 2D. / 2D context.
 * @param w - Ancho lógico. / Logical width.
 * @param frente - Borde delantero del cubo. / Cube front edge.
 * @param vel - Velocidad de desfile. / Parade speed.
 * @param t - Segundos (bucle). / Seconds (looping).
 * @param sueloY - Altura del suelo. / Ground height.
 * @param lado - Lado del cubo. / Cube side.
 * @param c - Colores. / Colors.
 */
function pintarPinchos(
  g: CanvasRenderingContext2D, w: number, frente: number, vel: number,
  t: number, sueloY: number, lado: number, c: Tinta,
): void {
  // Pinchos faseados: cada morro llega en k*PERIODO + LLEGADA, justo tras
  // despegar y con tiempo de sobra antes de tomar tierra: el cubo libra siempre.
  // Phased spikes: each front arrives at k*PERIODO + LLEGADA, just after
  // takeoff with plenty of time before landing: the cube always clears.
  g.fillStyle = c.tinta;
  const kAhora = Math.floor((t - LLEGADA) / PERIODO);
  for (let kk = kAhora - 1; kk <= kAhora + 4; kk++) {
    const fx = frente + vel * (kk * PERIODO + LLEGADA - t);
    if (fx < -40 || fx > w + 40) continue;
    const ph = lado * (0.7 + 0.2 * alturaPincho(kk));
    g.beginPath();
    g.moveTo(fx, sueloY);
    g.lineTo(fx + ANCHO_PINCHO / 2, sueloY - ph);
    g.lineTo(fx + ANCHO_PINCHO, sueloY);
    g.closePath();
    g.fill();
  }
}

/**
 * Pinta el cubo rotando en el aire.
 * Paints the cube rotating mid-air.
 * @param g - Contexto 2D. / 2D context.
 * @param cubeX - Izquierda del cubo. / Cube left.
 * @param sueloY - Altura del suelo. / Ground height.
 * @param lado - Lado del cubo. / Cube side.
 * @param altura - Altura de salto. / Jump height.
 * @param enAire - Si está volando. / Whether airborne.
 * @param k - Progreso del salto. / Jump progress.
 * @param c - Colores. / Colors.
 */
function pintarCubo(
  g: CanvasRenderingContext2D, cubeX: number, sueloY: number, lado: number,
  altura: number, enAire: boolean, k: number, c: Tinta,
): void {
  // Cubo. / Cube.
  const jy = sueloY - lado - altura;
  g.save();
  g.translate(cubeX + lado / 2, jy + lado / 2);
  g.rotate(enAire ? k * Math.PI * 2 : 0);
  g.fillStyle = c.acento;
  g.fillRect(-lado / 2, -lado / 2, lado, lado);
  g.fillStyle = c.tinta;
  g.globalAlpha = 0.85;
  const inner = lado * 0.45;
  g.fillRect(-inner / 2, -inner / 2, inner, inner);
  g.restore();
  g.globalAlpha = 1;
}

/**
 * Pinta un fotograma de la vista previa.
 * Paints one frame of the preview.
 * @param g - Contexto 2D ya dimensionado. / Sized 2D context.
 * @param w - Ancho lógico. / Logical width.
 * @param h - Alto lógico. / Logical height.
 * @param t - Segundos (bucle). / Seconds (looping).
 * @param c - Colores. / Colors.
 */
export function dibujarCubo(g: CanvasRenderingContext2D, w: number, h: number, t: number, c: Tinta): void {
  g.clearRect(0, 0, w, h);
  const sueloY = h - h * 0.22;
  const lado = Math.max(10, h * 0.11);
  const vel = w * 0.42;
  const cubeX = w * 0.28;
  const frente = cubeX + lado;
  pintarSuelo(g, w, sueloY, t, vel, c);
  // Salto: despegue en cada múltiplo del periodo. / Jump: takeoff on every period multiple.
  const { altura, k, enAire } = faseSalto(t, h);
  pintarPinchos(g, w, frente, vel, t, sueloY, lado, c);
  pintarCubo(g, cubeX, sueloY, lado, altura, enAire, k, c);
}
