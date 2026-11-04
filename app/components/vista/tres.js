const GUION = [
    { t: 0.4, m: "X", x: 0, y: 0 },
    { t: 1.05, m: "O", x: 1, y: 0 },
    { t: 1.7, m: "X", x: 0, y: 1 },
    { t: 2.35, m: "O", x: 1, y: 1 },
    { t: 3.0, m: "X", x: 0, y: 2 },
];
const CICLO = 4.8;
function hayGanadora(tt) {
    return tt >= (GUION[GUION.length - 1]?.t ?? 0);
}
function pintarTriunfo(g, w, h, tt, c) {
    g.fillStyle = c.acento;
    g.globalAlpha = 0.22 + 0.08 * Math.sin(tt * 5);
    g.fillRect((w / 3) * 0.08, (h / 3) * 0.06, (w / 3) * 0.84, h * 0.88);
    g.globalAlpha = 1;
}
function pintarMarca(g, j, tt, cw, ch, c) {
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
export function dibujarTres(g, w, h, t, c) {
    g.clearRect(0, 0, w, h);
    const tt = ((t % CICLO) + CICLO) % CICLO;
    const n = 3;
    const cw = w / n;
    const ch = h / n;
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
    if (hayGanadora(tt))
        pintarTriunfo(g, w, h, tt, c);
    for (const j of GUION) {
        if (tt < j.t)
            continue;
        pintarMarca(g, j, tt, cw, ch, c);
    }
}
