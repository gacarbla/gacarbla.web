import { FINAL, HASHES, ITERACIONES, MESAS, POEMAS, SALT, SECCIONES, type Mesa } from "../components/jardin/datos.js";

/**
 * El Archivo: poemas públicos, verificación de tokens por hash y mesas
 * cifradas que solo se abren combinando cuatro respuestas.
 * The Archive: public poems, token verification by hash and encrypted
 * tables that only open by combining four answers.
 */

/** Clave de guardado. / Save key. */
const CLAVE = "gacarbla:archivo";
/** Versión del formato. / Format version. */
const VERSION = 1;

/** Guardado: solo lo resuelto, nunca los tokens. / Save: only what is solved, never tokens. */
export interface Estado {
  version: number;
  mesas: string[];
  inicio: number;
  fin: number;
}

/** Mesa abierta con su texto. / Opened table with its text. */
export interface Apertura {
  id: string;
  texto: string;
}

/** Estado vacío. / Empty state. */
export function estadoNuevo(): Estado {
  return { version: VERSION, mesas: [], inicio: Date.now(), fin: 0 };
}

/** Lista segura. / Safe list. */
function lista(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

/**
 * Lee el guardado. / Reads the save.
 */
export function leerEstado(): Estado {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return estadoNuevo();
    const e = JSON.parse(raw) as Partial<Estado>;
    if (e.version !== VERSION) return estadoNuevo();
    return {
      version: VERSION,
      mesas: lista(e.mesas),
      inicio: typeof e.inicio === "number" ? e.inicio : Date.now(),
      fin: typeof e.fin === "number" ? e.fin : 0,
    };
  } catch {
    return estadoNuevo();
  }
}

/**
 * Guarda el estado. / Saves the state.
 */
export function guardarEstado(e: Estado): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    /* guardado opcional / optional save */
  }
}

/**
 * Borra el progreso. / Wipes progress.
 */
export function olvidar(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento / no storage */
  }
}

/** Poemas públicos (1–8). / Public poems (1–8). */
export function poemas() {
  return POEMAS;
}

/** Mesa abierta. / Is the table open? */
export function abierta(e: Estado, id: string): boolean {
  return e.mesas.includes(id);
}

/** ¿Archivo completo? / Is the archive complete? */
export function completo(e: Estado): boolean {
  return abierta(e, "mesa-2");
}

/** Sección secreta por id. / Secret section by id. */
export function seccion(id: string) {
  return SECCIONES[id] ?? null;
}

/** Línea final del archivo. / Final archive line. */
export function lineaFinal(): string {
  return FINAL;
}

/**
 * Normaliza una respuesta: minúsculas, sin tildes ni espacios.
 * Normalizes an answer: lowercase, no accents, no spaces.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

/** Codifica base64 a bytes. / Base64 to bytes. */
function deBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/**
 * Huella de un token, igual que la del sellado. / Token fingerprint, as sealed.
 */
export async function huella(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(normalizar(texto));
  const buf = await crypto.subtle.digest("SHA-256", datos);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * ¿El token corresponde a ese poema? / Does the token match that poem?
 */
export async function tokenValido(n: number, texto: string): Promise<boolean> {
  const esperado = HASHES[n];
  if (!esperado || !normalizar(texto)) return false;
  return (await huella(texto)) === esperado;
}

/**
 * Concatena con prefijo de longitud (idéntico al sellado).
 * Concatenates with a length prefix (identical to sealing).
 */
function lp(textos: string[]): Uint8Array {
  const trozos: Uint8Array[] = [];
  let total = 0;
  for (const t of textos) {
    const b = new TextEncoder().encode(normalizar(t));
    const cab = new Uint8Array(4);
    new DataView(cab.buffer).setUint32(0, b.length, false);
    trozos.push(cab, b);
    total += 4 + b.length;
  }
  const out = new Uint8Array(total);
  let pos = 0;
  for (const t of trozos) {
    out.set(t, pos);
    pos += t.length;
  }
  return out;
}

/**
 * Deriva la clave de la mesa con HKDF-SHA256. / Derives the table key with HKDF-SHA256.
 */
async function claveDe(ikm: Uint8Array, info: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: deBase64(SALT), info: new TextEncoder().encode(info) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

/**
 * Intenta abrir una mesa con sus cuatro respuestas.
 * Tries to open a table with its four answers.
 * @param e - Estado vivo. / Live state.
 * @param mesa - Mesa a abrir. / Table to open.
 * @param respuestas - Cuatro respuestas en orden de poema. / Four answers in poem order.
 * @returns Texto descifrado o null. / Decrypted text or null.
 */
export async function abrirMesa(e: Estado, mesa: Mesa, respuestas: string[]): Promise<string | null> {
  if (!(await todasValidas(mesa, respuestas))) return null;
  const info = mesa.id === "mesa-1" ? "gc/p9/unlock/v1" : "gc/p10/unlock/v1";
  try {
    const clave = await claveDe(lp(respuestas), info);
    const plano = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: deBase64(mesa.iv) },
      clave,
      deBase64(mesa.data),
    );
    if (!e.mesas.includes(mesa.id)) e.mesas.push(mesa.id);
    if (completo(e)) e.fin = Date.now();
    guardarEstado(e);
    return new TextDecoder().decode(plano);
  } catch {
    return null;
  }
}

/**
 * ¿Las cuatro respuestas corresponden a los poemas de la mesa?
 * Do the four answers match the table poems?
 */
async function todasValidas(mesa: Mesa, respuestas: string[]): Promise<boolean> {
  if (respuestas.length !== mesa.poemas.length) return false;
  for (let i = 0; i < mesa.poemas.length; i++) {
    if (!(await tokenValido(mesa.poemas[i] as number, respuestas[i] as string))) return false;
  }
  return true;
}

/** Mesas con sus poemas. / Tables with their poems. */
export function mesas(): readonly Mesa[] {
  return MESAS;
}

/** Iteraciones declaradas (documentación del sellado). / Declared iterations (sealing documentation). */
export function iteraciones(): number {
  return ITERACIONES;
}
