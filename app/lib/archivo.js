import { HASHES, MESAS, POEMAS, SALT, SECCIONES } from "../components/jardin/datos.js";
import { claveDe, descifrar, huella, lp, normalizar } from "./cripto.js";
const CLAVE = "gacarbla:archivo";
const VERSION = 3;
export function estadoNuevo() {
    return { version: VERSION, mesas: [], inicio: Date.now(), fin: 0 };
}
function lista(v) {
    return Array.isArray(v) ? v : [];
}
export function leerEstado() {
    try {
        const raw = localStorage.getItem(CLAVE);
        if (!raw)
            return estadoNuevo();
        const e = JSON.parse(raw);
        if (e.version !== VERSION)
            return estadoNuevo();
        return {
            version: VERSION,
            mesas: lista(e.mesas),
            inicio: typeof e.inicio === "number" ? e.inicio : Date.now(),
            fin: typeof e.fin === "number" ? e.fin : 0,
        };
    }
    catch {
        return estadoNuevo();
    }
}
export function guardarEstado(e) {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(e));
    }
    catch {
    }
}
export function poemas() {
    return POEMAS;
}
export function abierta(e, id) {
    return e.mesas.includes(id);
}
export function seccion(id) {
    return SECCIONES[id] ?? null;
}
async function todasValidas(mesa, respuestas) {
    if (respuestas.length !== mesa.poemas.length)
        return false;
    for (let i = 0; i < mesa.poemas.length; i++) {
        if (!(await tokenValido(mesa.poemas[i], respuestas[i])))
            return false;
    }
    return true;
}
export async function tokenValido(n, texto) {
    const esperado = HASHES[n];
    if (!esperado || !normalizar(texto))
        return false;
    return (await huella(texto)) === esperado;
}
export async function abrirMesa(e, mesa, respuestas) {
    if (!(await todasValidas(mesa, respuestas)))
        return null;
    const info = mesa.id === "mesa-1" ? "gc/p9/unlock/v1" : "gc/p10/unlock/v1";
    try {
        const clave = await claveDe(lp(respuestas), info, SALT);
        const plano = await descifrar({ iv: mesa.iv, data: mesa.data }, clave);
        if (!e.mesas.includes(mesa.id))
            e.mesas.push(mesa.id);
        if (abierta(e, "mesa-2"))
            e.fin = Date.now();
        guardarEstado(e);
        return plano;
    }
    catch {
        return null;
    }
}
export function mesas() {
    return MESAS;
}
