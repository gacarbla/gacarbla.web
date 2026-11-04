import { FASE2, FASE3, HASH_FASE2, HASH_FASE3, HASH_FINAL, SALT, } from "../components/jardin/datos.js";
import { claveDe, descifrar, huellaConSal, normalizar } from "./cripto.js";
let palabra2 = null;
let palabra3 = null;
export function guardarPalabraFase2(palabra) {
    palabra2 = palabra;
}
export function palabraFase2() {
    return palabra2;
}
export function guardarPalabraFase3(palabra) {
    palabra3 = palabra;
}
export function palabraFase3() {
    return palabra3;
}
export async function verificarFase2(palabra) {
    return (await huellaConSal(palabra, "gc/fase2/check/v1", SALT)) === HASH_FASE2;
}
export async function verificarFase3(palabra) {
    return (await huellaConSal(palabra, "gc/fase3/check/v1", SALT)) === HASH_FASE3;
}
export async function verificarFinal(palabra) {
    return (await huellaConSal(palabra, "gc/final/check/v1", SALT)) === HASH_FINAL;
}
async function descifrarConPalabra(palabra, info, bloque) {
    try {
        const ikm = new TextEncoder().encode(normalizar(palabra));
        const clave = await claveDe(ikm, info, SALT);
        return await descifrar(bloque, clave);
    }
    catch {
        return null;
    }
}
export async function abrirFase2(palabra) {
    if (!(await verificarFase2(palabra)))
        return null;
    return descifrarConPalabra(palabra, "gc/fase2/text/v1", FASE2);
}
export async function abrirFase3(palabra) {
    if (!(await verificarFase3(palabra)))
        return null;
    return descifrarConPalabra(palabra, "gc/fase3/text/v1", FASE3);
}
const INSIGNIA = "gacarbla:insignia";
export function insigniaGanada() {
    try {
        return localStorage.getItem(INSIGNIA) === "1";
    }
    catch {
        return false;
    }
}
export function ganarInsignia() {
    try {
        localStorage.setItem(INSIGNIA, "1");
    }
    catch {
    }
    window.dispatchEvent(new Event("gacarbla:insignia"));
}
