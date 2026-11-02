export const FISICA = {
    vSalto: 580,
    gravedad: 3400,
    vOrbe: 700,
    vCojin: 1150,
    vel: 430,
    jugador: 32,
};
export function alturaMax() {
    return (FISICA.vSalto * FISICA.vSalto) / (2 * FISICA.gravedad);
}
export function alcanceMax() {
    return (2 * (FISICA.vSalto / FISICA.gravedad)) * FISICA.vel;
}
const PATRONES = {
    0: (x0, _sueloY, poner) => { poner({ x: x0, w: 26, h: 26 }); },
    1: (x0, _sueloY, poner) => { poner({ x: x0, w: 26, h: 26 }); poner({ x: x0 + 130, w: 26, h: 26 }); },
    2: (x0, _sueloY, poner) => { poner({ x: x0, w: 54, h: 26 }); },
    3: (x0, _sueloY, poner) => { for (let i = 0; i < 3; i++)
        poner({ x: x0 + i * 38, w: 26, h: 26 }); },
    4: (x0, _sueloY, poner) => { poner({ x: x0, w: 26, h: 26 }); poner({ x: x0 + 140, w: 54, h: 26 }); },
    5: (x0, _sueloY, poner, pads) => { pads.push({ x: x0, w: 40 }); for (let i = 0; i < 3; i++)
        poner({ x: x0 + 110 + i * 36, h: 26, w: 26 }); },
    6: (x0, sueloY, poner, _pads, orbes) => { poner({ x: x0, w: 54, h: 26 }); orbes.push({ x: x0 + 27, y: sueloY - 70 }); },
    7: (x0, _sueloY, poner) => { poner({ x: x0, w: 54, h: 26 }); poner({ x: x0 + 150, w: 54, h: 26 }); },
    8: (x0, sueloY, poner, _pads, orbes) => { for (let i = 0; i < 3; i++)
        poner({ x: x0 + i * 38, w: 26, h: 26 }); orbes.push({ x: x0 + 45, y: sueloY - 70 }); },
    9: (x0, _sueloY, poner, pads) => { pads.push({ x: x0, w: 40 }); for (let i = 0; i < 4; i++)
        poner({ x: x0 + 110 + i * 36, w: 26, h: 26 }); },
};
export function tramo(id, x0, sueloY) {
    const obs = [];
    const pads = [];
    const orbes = [];
    const poner = (o) => { obs.push(o); };
    const construir = PATRONES[id] ?? PATRONES[9];
    construir(x0, sueloY, poner, pads, orbes);
    let ancho = 0;
    for (const o of obs)
        ancho = Math.max(ancho, o.x - x0 + o.w);
    for (const p of pads)
        ancho = Math.max(ancho, p.w);
    return { obs, pads, orbes, ancho };
}
export function bolsa(d) {
    if (d <= 0)
        return [0];
    if (d === 1)
        return [0, 0, 1, 2];
    if (d === 2)
        return [1, 2, 4];
    if (d === 3)
        return [2, 3, 4, 5, 6];
    return [4, 5, 6, 7, 8, 9];
}
function rachasSuperables(t) {
    const fallos = [];
    const alc = alcanceMax();
    const suelo = t.obs.sort((a, b) => a.x - b.x);
    let ini = -1;
    let fin = -1e9;
    const asistida = (x0) => t.pads.some((p) => p.x < x0 && x0 - p.x < 340);
    const cierra = () => {
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
function orbesEnBanda(t, sueloY) {
    const fallos = [];
    for (const o of t.orbes) {
        if (o.y < sueloY - 100 || o.y > sueloY - 40)
            fallos.push(`orbe fuera de banda ${o.y}`);
    }
    return fallos;
}
export function verifica(t, sueloY) {
    return [...rachasSuperables(t), ...orbesEnBanda(t, sueloY)];
}
