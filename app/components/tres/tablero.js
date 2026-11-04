export function otra(m) {
    return m === "X" ? "O" : "X";
}
const LINEAS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];
export function lineaGanadora(tablero) {
    for (const l of LINEAS) {
        const [a, b, c] = l;
        if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c])
            return l;
    }
    return null;
}
export function libres(tablero) {
    const out = [];
    for (let i = 0; i < 9; i++)
        if (!tablero[i])
            out.push(i);
    return out;
}
function barajar(xs, rnd) {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function evalua(tablero, yo, prof) {
    const g = lineaGanadora(tablero);
    if (g)
        return tablero[g[0]] === yo ? 10 - prof : prof - 10;
    if (libres(tablero).length === 0)
        return 0;
    return null;
}
function maximiza(tablero, yo, turno, prof, alfa, beta) {
    let v = -Infinity;
    const mv = libres(tablero);
    for (const m of mv) {
        tablero[m] = turno;
        v = Math.max(v, minimax(tablero, yo, otra(turno), prof + 1, alfa, beta));
        tablero[m] = null;
        alfa = Math.max(alfa, v);
        if (beta <= alfa)
            break;
    }
    return v;
}
function minimiza(tablero, yo, turno, prof, alfa, beta) {
    let v = Infinity;
    const mv = libres(tablero);
    for (const m of mv) {
        tablero[m] = turno;
        v = Math.min(v, minimax(tablero, yo, otra(turno), prof + 1, alfa, beta));
        tablero[m] = null;
        beta = Math.min(beta, v);
        if (beta <= alfa)
            break;
    }
    return v;
}
function minimax(tablero, yo, turno, prof, alfa, beta) {
    const fin = evalua(tablero, yo, prof);
    if (fin !== null)
        return fin;
    if (turno === yo)
        return maximiza(tablero, yo, turno, prof, alfa, beta);
    return minimiza(tablero, yo, turno, prof, alfa, beta);
}
function ordenaCandidatos(tablero, rnd) {
    return barajar(libres(tablero), rnd);
}
function eligeMejor(tablero, yo, candidatos) {
    let mejor = candidatos[0];
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
export function mejorJugada(tablero, yo, rnd = Math.random) {
    return eligeMejor(tablero, yo, ordenaCandidatos(tablero, rnd));
}
export function jugadaNormal(tablero, yo, rnd = Math.random) {
    const rival = otra(yo);
    const mv = libres(tablero);
    for (const m of mv) {
        tablero[m] = yo;
        const gana = lineaGanadora(tablero) !== null;
        tablero[m] = null;
        if (gana)
            return m;
    }
    for (const m of mv) {
        tablero[m] = rival;
        const tapa = lineaGanadora(tablero) !== null;
        tablero[m] = null;
        if (tapa)
            return m;
    }
    return mv[Math.floor(rnd() * mv.length)];
}
export function jugadaFacil(tablero, rnd = Math.random) {
    const mv = libres(tablero);
    return mv[Math.floor(rnd() * mv.length)];
}
export function jugadaNivel(tablero, yo, nivel, rnd = Math.random) {
    if (nivel <= 0)
        return jugadaFacil(tablero, rnd);
    if (nivel === 1)
        return jugadaNormal(tablero, yo, rnd);
    return mejorJugada(tablero, yo, rnd);
}
