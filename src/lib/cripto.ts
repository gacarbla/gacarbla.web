/**
 * Utilidades criptográficas compartidas por El Archivo y sus fases:
 * normalización, base64, HKDF, AES-GCM y huellas SHA-256.
 * Shared cryptographic helpers for The Archive and its phases:
 * normalization, base64, HKDF, AES-GCM and SHA-256 fingerprints.
 */

/**
 * Normaliza una respuesta: minúsculas, sin tildes ni espacios.
 * Normalizes an answer: lowercase, no accents, no spaces.
 * @param texto - Texto crudo. / Raw text.
 * @returns Texto normalizado. / Normalized text.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

/**
 * Codifica base64 a bytes. / Decodes base64 to bytes.
 * @param b64 - Cadena base64. / Base64 string.
 * @returns Bytes. / Bytes.
 */
export function deBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/**
 * Codifica bytes a base64. / Encodes bytes to base64.
 * @param bytes - Bytes. / Bytes.
 * @returns Cadena base64. / Base64 string.
 */
export function aBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Concatena con prefijo de longitud (idéntico al sellado).
 * Concatenates with a length prefix (identical to sealing).
 * @param textos - Textos a concatenar. / Texts to concatenate.
 * @returns Bytes concatenados. / Concatenated bytes.
 */
export function lp(textos: string[]): Uint8Array {
  const trozos: Uint8Array[] = [];
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

/**
 * Une trozos en un único bloque. / Joins chunks into one block.
 * @param trozos - Bloques. / Chunks.
 * @param total - Longitud total. / Total length.
 * @returns Bloque unido. / Joined block.
 */
function concatenar(trozos: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let pos = 0;
  for (const t of trozos) {
    out.set(t, pos);
    pos += t.length;
  }
  return out;
}

/**
 * Huella SHA-256 en base64 de un texto normalizado.
 * SHA-256 fingerprint in base64 of a normalized text.
 * @param texto - Texto. / Text.
 * @returns Huella base64. / Base64 fingerprint.
 */
export async function huella(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(normalizar(texto));
  const buf = await crypto.subtle.digest("SHA-256", datos);
  return aBase64(new Uint8Array(buf));
}

/**
 * Huella de una palabra de fase: sal de época + dominio + palabra.
 * Phase-word fingerprint: epoch salt + domain + word.
 * @param texto - Palabra. / Word.
 * @param info - Dominio. / Domain.
 * @param saltB64 - Sal de época en base64. / Epoch salt in base64.
 * @returns Huella base64. / Base64 fingerprint.
 */
export async function huellaConSal(texto: string, info: string, saltB64: string): Promise<string> {
  const cab = new TextEncoder().encode(info);
  const palabra = new TextEncoder().encode(normalizar(texto));
  const total = deBase64(saltB64).length + cab.length + palabra.length;
  const buf = await crypto.subtle.digest("SHA-256", concatenar([deBase64(saltB64), cab, palabra], total));
  return aBase64(new Uint8Array(buf));
}

/**
 * Deriva una clave AES-GCM de 256 bits con HKDF-SHA256.
 * Derives a 256-bit AES-GCM key with HKDF-SHA256.
 * @param ikm - Material de entrada. / Input key material.
 * @param info - Dominio. / Domain.
 * @param saltB64 - Sal de época en base64. / Epoch salt in base64.
 * @returns Clave para descifrar. / Key for decryption.
 */
export async function claveDe(ikm: Uint8Array, info: string, saltB64: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: deBase64(saltB64), info: new TextEncoder().encode(info) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

/**
 * Descifra un bloque AES-GCM. / Decrypts an AES-GCM block.
 * @param bloque - IV y datos. / IV and data.
 * @param clave - Clave derivada. / Derived key.
 * @returns Texto plano. / Plain text.
 */
export async function descifrar(bloque: { iv: string; data: string }, clave: CryptoKey): Promise<string> {
  const plano = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: deBase64(bloque.iv) },
    clave,
    deBase64(bloque.data),
  );
  return new TextDecoder().decode(plano);
}
