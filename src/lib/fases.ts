import {
  FASE2,
  FASE3,
  HASH_FASE2,
  HASH_FASE3,
  HASH_FINAL,
  SALT,
  type Bloque,
} from "../components/jardin/datos.js";
import { claveDe, descifrar, huellaConSal, normalizar } from "./cripto.js";

/**
 * Fases 2 y 3: la palabra que abre cada puerta vive solo en memoria.
 * El hash decide si se muestra la página o un 404; la palabra derive la
 * clave que descifra el texto. Sin palabra no hay texto.
 * Phases 2 and 3: the word that opens each door lives in memory only.
 * The hash decides whether to show the page or a 404; the word derives
 * the key that decrypts the text. Without the word there is no text.
 */

/** Palabras en memoria (se pierden al recargar). / In-memory words (lost on reload). */
let palabra2: string | null = null;
let palabra3: string | null = null;

/** Guarda la palabra de la fase 2. / Stores the phase 2 word. */
export function guardarPalabraFase2(palabra: string): void {
  palabra2 = palabra;
}

/** Lee la palabra de la fase 2. / Reads the phase 2 word. */
export function palabraFase2(): string | null {
  return palabra2;
}

/** Guarda la palabra de la fase 3. / Stores the phase 3 word. */
export function guardarPalabraFase3(palabra: string): void {
  palabra3 = palabra;
}

/** Lee la palabra de la fase 3. / Reads the phase 3 word. */
export function palabraFase3(): string | null {
  return palabra3;
}

/** ¿La palabra abre la fase 2? / Does the word open phase 2? */
export async function verificarFase2(palabra: string): Promise<boolean> {
  return (await huellaConSal(palabra, "gc/fase2/check/v1", SALT)) === HASH_FASE2;
}

/** ¿La palabra abre la fase 3? / Does the word open phase 3? */
export async function verificarFase3(palabra: string): Promise<boolean> {
  return (await huellaConSal(palabra, "gc/fase3/check/v1", SALT)) === HASH_FASE3;
}

/** ¿La palabra cierra el archivo? / Does the word close the archive? */
export async function verificarFinal(palabra: string): Promise<boolean> {
  return (await huellaConSal(palabra, "gc/final/check/v1", SALT)) === HASH_FINAL;
}

/**
 * Descifra un bloque con la palabra dada. / Decrypts a block with the given word.
 * @param palabra - Palabra de la fase. / Phase word.
 * @param info - Dominio de la clave. / Key domain.
 * @param bloque - Bloque cifrado. / Encrypted block.
 * @returns Texto o null. / Text or null.
 */
async function descifrarConPalabra(
  palabra: string,
  info: string,
  bloque: Bloque,
): Promise<string | null> {
  try {
    const ikm = new TextEncoder().encode(normalizar(palabra));
    const clave = await claveDe(ikm, info, SALT);
    return await descifrar(bloque, clave);
  } catch {
    return null;
  }
}

/** Texto de la fase 2 o null. / Phase 2 text or null. */
export async function abrirFase2(palabra: string): Promise<string | null> {
  if (!(await verificarFase2(palabra))) return null;
  return descifrarConPalabra(palabra, "gc/fase2/text/v1", FASE2);
}

/** Texto de la fase 3 o null. / Phase 3 text or null. */
export async function abrirFase3(palabra: string): Promise<string | null> {
  if (!(await verificarFase3(palabra))) return null;
  return descifrarConPalabra(palabra, "gc/fase3/text/v1", FASE3);
}

/** Clave de la insignia. / Badge key. */
const INSIGNIA = "gacarbla:insignia";

/** ¿La insignia ya se ganó? / Has the badge been earned? */
export function insigniaGanada(): boolean {
  try {
    return localStorage.getItem(INSIGNIA) === "1";
  } catch {
    return false;
  }
}

/** Gana la insignia y avisa a la navegación. / Earns the badge and notifies navigation. */
export function ganarInsignia(): void {
  try {
    localStorage.setItem(INSIGNIA, "1");
  } catch {
    /* sin almacenamiento: la insignia vive la sesión / no storage: badge lives this session */
  }
  window.dispatchEvent(new Event("gacarbla:insignia"));
}
