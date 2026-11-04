export const LADO = 7;
function clave(ax, ay, bx, by) {
    return ax < bx || (ax === bx && ay < by) ? `${ax},${ay}|${bx},${by}` : `${bx},${by}|${ax},${ay}`;
}
export function hayMuro(muros, ax, ay, bx, by) {
    return muros.has(clave(ax, ay, bx, by));
}
const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
];
function dentro(nx, ny, lado) {
    return nx >= 0 && ny >= 0 && nx < lado && ny < lado;
}
function vecinasAbiertas(c, muros, lado) {
    const out = [];
    for (const [dx, dy] of DIRS) {
        const nx = c.x + dx;
        const ny = c.y + dy;
        if (!dentro(nx, ny, lado) || hayMuro(muros, c.x, c.y, nx, ny))
            continue;
        out.push({ x: nx, y: ny });
    }
    return out;
}
function conexo(muros, lado) {
    const vistos = new Set(["0,0"]);
    const cola = [{ x: 0, y: 0 }];
    while (cola.length > 0) {
        const c = cola.pop();
        for (const n of vecinasAbiertas(c, muros, lado)) {
            const k = `${n.x},${n.y}`;
            if (vistos.has(k))
                continue;
            vistos.add(k);
            cola.push(n);
        }
    }
    return vistos.size === lado * lado;
}
function todasLasAristas(lado) {
    const aristas = [];
    for (let y = 0; y < lado; y++) {
        for (let x = 0; x < lado; x++) {
            if (x + 1 < lado)
                aristas.push([x, y, x + 1, y]);
            if (y + 1 < lado)
                aristas.push([x, y, x, y + 1]);
        }
    }
    return aristas;
}
function barajar(a, rnd) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
export function generarMuros(total = 25, lado = LADO, rnd = Math.random) {
    const aristas = barajar(todasLasAristas(lado), rnd);
    const muros = new Set();
    for (const [ax, ay, bx, by] of aristas) {
        if (muros.size >= total)
            break;
        const k = clave(ax, ay, bx, by);
        muros.add(k);
        if (!conexo(muros, lado))
            muros.delete(k);
    }
    return muros;
}
export function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function estaOcupada(ocupadas, x, y) {
    return ocupadas.some((o) => o.x === x && o.y === y);
}
function casillaAlAzar(lado, rnd) {
    return { x: Math.floor(rnd() * lado), y: Math.floor(rnd() * lado) };
}
function muestrear(pred, lado, rnd, intentos) {
    for (let i = 0; i < intentos; i++) {
        const c = casillaAlAzar(lado, rnd);
        if (pred(c))
            return c;
    }
    return null;
}
function primeraLibre(ocupadas, lado) {
    for (let y = 0; y < lado; y++) {
        for (let x = 0; x < lado; x++) {
            if (!estaOcupada(ocupadas, x, y))
                return { x, y };
        }
    }
    return { x: Math.floor(lado / 2), y: Math.floor(lado / 2) };
}
export function colocarPunto(ocupadas, origenes, lado = LADO, rnd = Math.random) {
    const libre = (c) => !estaOcupada(ocupadas, c.x, c.y);
    const estricta = (c) => libre(c) &&
        ocupadas.every((o) => manhattan(c, o) > 1) &&
        origenes.every((o) => manhattan(c, o) > 1);
    const sinOrigen = (c) => libre(c) && ocupadas.every((o) => manhattan(c, o) > 1);
    return (muestrear(estricta, lado, rnd, 500) ?? muestrear(sinOrigen, lado, rnd, 500) ?? primeraLibre(ocupadas, lado));
}
