const LADO = 7;
const VEL = 2.6;
const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
];
function dentro(x, y) {
    return x >= 0 && y >= 0 && x < LADO && y < LADO;
}
function azar(x, y, d) {
    let n = (x * 374761393 + y * 668265263 + d * 2246822519) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function hayMuro(ax, ay, bx, by) {
    if (bx === ax + 1)
        return azar(ax, ay, 1) < 0.16;
    if (bx === ax - 1)
        return azar(bx, by, 1) < 0.16;
    if (by === ay + 1)
        return azar(ax, ay, 2) < 0.16;
    return azar(ax, by, 2) < 0.16;
}
function vecinasAbiertas(c) {
    const out = [];
    for (const [dx, dy] of DIRS) {
        const nx = c.x + dx;
        const ny = c.y + dy;
        if (!dentro(nx, ny))
            continue;
        if (hayMuro(c.x, c.y, nx, ny))
            continue;
        out.push({ x: nx, y: ny });
    }
    return out;
}
function reconstruir(prev, dest) {
    const ruta = [];
    let k = `${dest.x},${dest.y}`;
    while (k) {
        const [x, y] = k.split(",").map(Number);
        ruta.unshift({ x, y });
        k = prev.get(k) ?? null;
    }
    ruta.shift();
    return ruta;
}
function camino(sx, sy, tx, ty) {
    const prev = new Map([[`${sx},${sy}`, null]]);
    const cola = [{ x: sx, y: sy }];
    while (cola.length > 0) {
        const c = cola.shift();
        if (c.x === tx && c.y === ty)
            return reconstruir(prev, { x: tx, y: ty });
        for (const v of vecinasAbiertas(c)) {
            const k = `${v.x},${v.y}`;
            if (prev.has(k))
                continue;
            prev.set(k, `${c.x},${c.y}`);
            cola.push(v);
        }
    }
    return null;
}
function dist(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
export function crearLaberinto() {
    let px = 0.5;
    let py = 0.5;
    let ruta = [];
    let ox = 3;
    let oy = 3;
    let t = 0;
    const buscaObjetivo = (intentos) => {
        const aqui = { x: Math.floor(px), y: Math.floor(py) };
        for (let i = 0; i < intentos; i++) {
            const c = { x: Math.floor(Math.random() * LADO), y: Math.floor(Math.random() * LADO) };
            if (dist(aqui, c) < 2)
                continue;
            const r = camino(aqui.x, aqui.y, c.x, c.y);
            if (!r || r.length === 0)
                continue;
            ox = c.x;
            oy = c.y;
            ruta = r;
            return true;
        }
        return false;
    };
    const repliegueAVecina = () => {
        const aqui = { x: Math.floor(px), y: Math.floor(py) };
        for (const [dx, dy] of DIRS) {
            const nx = aqui.x + dx;
            const ny = aqui.y + dy;
            if (!dentro(nx, ny))
                continue;
            if (hayMuro(aqui.x, aqui.y, nx, ny))
                continue;
            ox = nx;
            oy = ny;
            ruta = [{ x: nx, y: ny }];
            return;
        }
        ox = aqui.x;
        oy = aqui.y;
        ruta = [];
    };
    const elegir = () => {
        if (buscaObjetivo(60))
            return;
        repliegueAVecina();
    };
    elegir();
    const avanzar = (dt) => {
        let queda = VEL * Math.min(0.05, Math.max(0, dt));
        while (queda > 0) {
            if (ruta.length === 0)
                elegir();
            const s = ruta[0];
            if (!s)
                break;
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
                if (ruta.length === 0)
                    elegir();
            }
            else {
                px += (dx / d) * queda;
                py += (dy / d) * queda;
                queda = 0;
            }
        }
    };
    const pintarReticula = (g, w, h, c) => {
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
    const pintarPunto = (g, w, h, c) => {
        void c;
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
    const pintarFicha = (g, w, h, c) => {
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
