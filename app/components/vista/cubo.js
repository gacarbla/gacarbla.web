export function leerTinta() {
    const cs = getComputedStyle(document.documentElement);
    return {
        tinta: cs.getPropertyValue("--ink").trim() || "#17150f",
        acento: cs.getPropertyValue("--accent").trim() || "#b3541e",
    };
}
const PERIODO = 1.6;
const AIRE = 0.82;
const LLEGADA = 0.12;
const ANCHO_PINCHO = 18;
function alturaPincho(k) {
    const n = Math.sin(k * 127.1) * 43758.5453;
    const f = n - Math.floor(n);
    return f < 0 ? f + 1 : f;
}
function faseSalto(t, h) {
    const p = (((t % PERIODO) + PERIODO) % PERIODO) / PERIODO;
    const enAire = p * PERIODO < AIRE;
    const k = enAire ? (p * PERIODO) / AIRE : 0;
    const altura = enAire ? Math.sin(k * Math.PI) * h * 0.36 : 0;
    return { altura, k, enAire };
}
function pintarSuelo(g, w, sueloY, t, vel, c) {
    g.fillStyle = c.tinta;
    g.globalAlpha = 0.55;
    g.fillRect(0, sueloY, w, 2);
    g.globalAlpha = 0.25;
    const off = (t * vel) % 44;
    for (let x = -off; x < w; x += 44)
        g.fillRect(x, sueloY + 6, 18, 2);
    g.globalAlpha = 1;
}
function pintarPinchos(g, w, frente, vel, t, sueloY, lado, c) {
    g.fillStyle = c.tinta;
    const kAhora = Math.floor((t - LLEGADA) / PERIODO);
    for (let kk = kAhora - 1; kk <= kAhora + 4; kk++) {
        const fx = frente + vel * (kk * PERIODO + LLEGADA - t);
        if (fx < -40 || fx > w + 40)
            continue;
        const ph = lado * (0.7 + 0.2 * alturaPincho(kk));
        g.beginPath();
        g.moveTo(fx, sueloY);
        g.lineTo(fx + ANCHO_PINCHO / 2, sueloY - ph);
        g.lineTo(fx + ANCHO_PINCHO, sueloY);
        g.closePath();
        g.fill();
    }
}
function pintarCubo(g, cubeX, sueloY, lado, altura, enAire, k, c) {
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
export function dibujarCubo(g, w, h, t, c) {
    g.clearRect(0, 0, w, h);
    const sueloY = h - h * 0.22;
    const lado = Math.max(10, h * 0.11);
    const vel = w * 0.42;
    const cubeX = w * 0.28;
    const frente = cubeX + lado;
    pintarSuelo(g, w, sueloY, t, vel, c);
    const { altura, k, enAire } = faseSalto(t, h);
    pintarPinchos(g, w, frente, vel, t, sueloY, lado, c);
    pintarCubo(g, cubeX, sueloY, lado, altura, enAire, k, c);
}
