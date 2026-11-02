import type { Tinta } from "./cubo.js";

/**
 * Mini-animación del tres en raya para la ficha de la sala: partida
 * guionizada en bucle que siempre gana X por la primera columna.
 * Sin estado: todo es función pura del tiempo.
 * Mini-animation of tic-tac-toe for the arcade card: scripted looping
 * game always won by X down the first column.
 * Stateless: everything is a pure function of time.
 */

/** Jugadas del guion: tiempo, marca, casilla. / Script moves: time, mark, cell. */
const GUION: Array<{ t: number; m: "X" | "O"; x: number; y: number }> = [
  { t: 0.4, m: "X", x: 0, y: 0 },
  { t: 1.05, m: "O", x: 1, y: 0 },
  { t: 1.7, m: "X", x: 0, y: 1 },
  { t: 2.35, m: "O", x: 1, y: 1 },
  { t: 3.0, m: "X", x: 0, y: 2 },
];
/** Duración del bucle. / Loop duration. */
const CICLO = 4.8;

/**
 * ¿La partida guionizada ya terminó en este instante? / Is the scripted game over at this instant?
 */
function hayGanadora(tt: number): boolean {
  return tt >= (GUION[GUION.length - 1]?.t ?? 0);
}

/**
 * Resalta la columna ganadora. / Highlights the winning column.
 */
function pintarTriunfo(g: CanvasRenderingContext2D, w: number, h: number, tt: number, c: Tinta): void {
  g.fillStyle = c.acento;
  g.globalAlpha = 0.22 + 0.08 * Math.sin(tt * 5);
  g.fillRect((w / 3) * 0.08, (h / 3) * 0.06, (w / 3) * 0.84, h * 0.88);
  g.globalAlpha = 1;
}

/**
 * Dibuja una marca con aparición rápida. / Draws a quickly popping mark.
 */
function pintarMarca(
  g: CanvasRenderingContext2D,
  j: { t: number; m: "X" | "O"; x: number; y: number },
  tt: number,
  cw: number,
  ch: number,
  c: Tinta,
): void {
  const k = Math.min(1, (tt - j.t) * 5);
  const cx = (j.x + 0.5) * cw;
  const cy = (j.y + 0.5) * ch;
  const r = Math.min(cw, ch) * 0.28 * (0.6 + 0.4 * k);
  g.lineWidth = Math.max(2, Math.min(cw, ch) * 0.09);
  if (j.m === "X") {
    g.strokeStyle = c.tinta;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(cx - r, cy - r);
    g.lineTo(cx + r, cy + r);
    g.moveTo(cx + r, cy - r);
    g.lineTo(cx - r, cy + r);
    g.stroke();
    return;
  }
  g.strokeStyle = c.acento;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
}

/**
 * Pinta un fotograma de la vista previa.
 * Paints one frame of the preview.
 */
export function dibujarTres(g: CanvasRenderingContext2D, w: number, h: number, t: number, c: Tinta): void {
  g.clearRect(0, 0, w, h);
  const tt = ((t % CICLO) + CICLO) % CICLO;
  const n = 3;
  const cw = w / n;
  const ch = h / n;
  // Retícula. / Grid.
  g.strokeStyle = c.tinta;
  g.globalAlpha = 0.35;
  g.lineWidth = Math.max(1, Math.min(w, h) * 0.012);
  g.beginPath();
  for (let i = 1; i < n; i++) {
    g.moveTo((i * w) / n, h * 0.06);
    g.lineTo((i * w) / n, h * 0.94);
    g.moveTo(w * 0.06, (i * h) / n);
    g.lineTo(w * 0.94, (i * h) / n);
  }
  g.stroke();
  g.globalAlpha = 1;
  // Resalte + marcas con aparición rápida. / Highlight + quickly popping marks.
  if (hayGanadora(tt)) pintarTriunfo(g, w, h, tt, c);
  for (const j of GUION) {
    if (tt < j.t) continue;
    pintarMarca(g, j, tt, cw, ch, c);
  }
}
