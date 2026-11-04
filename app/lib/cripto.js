export function normalizar(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "");
}
export function deBase64(b64) {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++)
        out[i] = s.charCodeAt(i);
    return out;
}
export function aBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
}
export function lp(textos) {
    const trozos = [];
    let total = 0;
    for (const t of textos) {
        const b = new TextEncoder().encode(normalizar(t));
        const cab = new Uint8Array(4);
        new DataView(cab.buffer).setUint32(0, b.length, false);
        trozos.push(cab, b);
        total += 4 + b.length;
    }
    return concatenar(trozos, total);
}
function concatenar(trozos, total) {
    const out = new Uint8Array(total);
    let pos = 0;
    for (const t of trozos) {
        out.set(t, pos);
        pos += t.length;
    }
    return out;
}
export async function huella(texto) {
    const datos = new TextEncoder().encode(normalizar(texto));
    const buf = await crypto.subtle.digest("SHA-256", datos);
    return aBase64(new Uint8Array(buf));
}
export async function huellaConSal(texto, info, saltB64) {
    const cab = new TextEncoder().encode(info);
    const palabra = new TextEncoder().encode(normalizar(texto));
    const total = deBase64(saltB64).length + cab.length + palabra.length;
    const buf = await crypto.subtle.digest("SHA-256", concatenar([deBase64(saltB64), cab, palabra], total));
    return aBase64(new Uint8Array(buf));
}
export async function claveDe(ikm, info, saltB64) {
    const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: deBase64(saltB64), info: new TextEncoder().encode(info) }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
}
export async function descifrar(bloque, clave) {
    const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deBase64(bloque.iv) }, clave, deBase64(bloque.data));
    return new TextDecoder().decode(plano);
}
