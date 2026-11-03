import { ETAPAS, FINAL, ITERACIONES, type EtapaCifrada } from "../components/misterio/datos.js";

/**
 * El misterio: cadena de pistas cifradas, guardado local y sellos.
 * Cada etapa de código va cifrada con su propia solución y guarda la
 * pista siguiente: sin resolver la actual no hay texto futuro legible.
 * The mystery: encrypted clue chain, local save and seals.
 * Each code stage is encrypted with its own solution and holds the next
 * clue: an unsolved stage has no readable future text.
 */

/** Clave de guardado. / Save key. */
const CLAVE = "gacarbla:misterio";
/** Versión del formato de guardado. / Save format version. */
const VERSION = 1;

/** Guardado del jugador. Nunca contiene soluciones. / Player save. Never holds solutions. */
export interface Estado {
  version: number;
  /** Etapas aceptadas. / Accepted stages. */
  paso: number;
  /** Claves derivadas exportadas (base64), una por etapa de código. / Exported derived keys (base64), one per code stage. */
  claves: string[];
  /** Fragmentos obtenidos, en orden. / Fragments obtained, in order. */
  fragmentos: string[];
  /** Sellos emitidos por los juegos. / Seals emitted by the games. */
  sellos: { laberinto?: string; tres?: string };
  /** Instante de inicio y de fin (ms). / Start and finish instants (ms). */
  inicio: number;
  fin: number;
}

/** Pista descifrada. / Decrypted clue. */
interface CargaPista {
  pista: string;
  fragmento: string;
}

/** Resultado de aceptar. / Accept outcome. */
export type Resultado =
  | { ok: true; pista: string; fragmento: string }
  | { ok: false; motivo: "vacio" | "no" | "sin-sello" };

/**
 * Estado vacío. / Empty state.
 */
export function estadoNuevo(): Estado {
  return { version: VERSION, paso: 0, claves: [], fragmentos: [], sellos: {}, inicio: Date.now(), fin: 0 };
}

/** Validador de listas. / List validator. */
function lista<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Validador de sellos. / Seal validator. */
function sellos(v: unknown): { laberinto?: string; tres?: string } {
  return v && typeof v === "object" ? (v as { laberinto?: string; tres?: string }) : {};
}

/** Validador de números. / Number validator. */
function num(v: unknown, porDefecto: number): number {
  return typeof v === "number" ? v : porDefecto;
}

/**
 * Normaliza un guardado leído. / Normalizes a read save.
 */
function normaliza(e: Partial<Estado>): Estado {
  return {
    version: VERSION,
    paso: num(e.paso, 0),
    claves: lista<string>(e.claves),
    fragmentos: lista<string>(e.fragmentos),
    sellos: sellos(e.sellos),
    inicio: num(e.inicio, Date.now()),
    fin: num(e.fin, 0),
  };
}

/**
 * Lee el guardado (o uno nuevo si no hay o está corrupto).
 * Reads the save (or a fresh one when missing or corrupt).
 */
export function leerEstado(): Estado {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return estadoNuevo();
    const e = JSON.parse(raw) as Partial<Estado>;
    return e.version === VERSION ? normaliza(e) : estadoNuevo();
  } catch {
    return estadoNuevo();
  }
}

/**
 * Guarda el estado (silencioso en modo privado).
 * Saves the state (silent in private mode).
 */
export function guardarEstado(e: Estado): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    /* guardado opcional / optional save */
  }
}

/**
 * Borra el progreso (enlace de reinicio). / Wipes progress (reset link).
 */
export function olvidar(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento / no storage */
  }
}

/**
 * ¿Misterio resuelto? / Is the mystery solved?
 */
export function resuelto(e: Estado): boolean {
  return e.paso >= ETAPAS.length;
}

/**
 * Total de etapas. / Total stages.
 */
export function totalEtapas(): number {
  return ETAPAS.length;
}

/**
 * Etapa actual o null si ya terminó. / Current stage or null when finished.
 */
export function etapaActual(e: Estado): EtapaCifrada | null {
  return ETAPAS[e.paso] ?? null;
}

/**
 * Pista en claro de la etapa actual (solo la 0). / Clear clue of the current stage (stage 0 only).
 */
export function pistaActual(e: Estado): string | null {
  return etapaActual(e)?.claro ?? null;
}

/** Decodificador base64 a bytes. / Base64 to bytes. */
function deBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Codificador de bytes a base64. / Bytes to base64. */
function aBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/**
 * Normaliza una entrada del jugador. / Normalizes player input.
 */
export function normalizar(texto: string): string {
  return texto.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Deriva la clave de una solución candidata. / Derives the key of a candidate solution.
 */
async function derivar(candidata: string, salt: string, extraer = false): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(normalizar(candidata)), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: deBase64(salt), iterations: ITERACIONES, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    extraer,
    ["decrypt"],
  );
}

/**
 * Descifra una carga con una clave. Devuelve null si no encaja.
 * Decrypts a payload with a key. Returns null on mismatch.
 */
async function descifrar(iv: string, data: string, clave: CryptoKey): Promise<string | null> {
  try {
    const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deBase64(iv) }, clave, deBase64(data));
    return new TextDecoder().decode(plano);
  } catch {
    return null;
  }
}

/**
 * Acepta un código o un sello en la etapa actual.
 * Accepts a code or a seal on the current stage.
 * @param e - Estado vivo (se muta solo al aceptar). / Live state (mutated only on accept).
 * @param entrada - Texto del jugador. / Player input.
 */
export async function aceptar(e: Estado, entrada: string): Promise<Resultado> {
  const etapa = etapaActual(e);
  if (!etapa) return { ok: false, motivo: "no" };
  const texto = normalizar(entrada);
  if (!texto) return { ok: false, motivo: "vacio" };
  if (etapa.tipo === "sello") return aceptarSello(e, etapa, texto);
  return aceptarCodigo(e, etapa, texto);
}

/**
 * Acepta un código: deriva su clave y descifra la carga de la etapa.
 * Accepts a code: derives its key and decrypts the stage payload.
 */
async function aceptarCodigo(e: Estado, etapa: EtapaCifrada, texto: string): Promise<Resultado> {
  if (!etapa.salt || !etapa.iv || !etapa.data) return { ok: false, motivo: "no" };
  const clave = await derivar(texto, etapa.salt, true);
  const plano = await descifrar(etapa.iv, etapa.data, clave);
  if (plano === null) return { ok: false, motivo: "no" };
  e.claves.push(aBase64(await crypto.subtle.exportKey("raw", clave)));
  return confirmar(e, JSON.parse(plano) as CargaPista);
}

/**
 * Acepta un sello comprobando el guardado y descifrando con la última clave.
 * Accepts a seal by checking the save and decrypting with the last key.
 */
async function aceptarSello(e: Estado, etapa: EtapaCifrada, texto: string): Promise<Resultado> {
  const sello = etapa.juego ? e.sellos[etapa.juego] : undefined;
  if (!sello) return { ok: false, motivo: "sin-sello" };
  if (normalizar(sello) !== texto) return { ok: false, motivo: "no" };
  const carga = await descifrarConUltimaClave(e, etapa);
  return carga ? confirmar(e, carga) : { ok: false, motivo: "no" };
}

/**
 * Descifra la carga con la última clave guardada. / Decrypts the payload with the last stored key.
 */
async function descifrarConUltimaClave(e: Estado, etapa: EtapaCifrada): Promise<CargaPista | null> {
  const ultima = e.claves[e.claves.length - 1];
  if (!ultima || !etapa.iv || !etapa.data) return null;
  const clave = await crypto.subtle.importKey("raw", deBase64(ultima), { name: "AES-GCM" }, false, ["decrypt"]);
  const plano = await descifrar(etapa.iv, etapa.data, clave);
  return plano === null ? null : (JSON.parse(plano) as CargaPista);
}

/**
 * Cierra una etapa aceptada. / Closes an accepted stage.
 */
function confirmar(e: Estado, carga: CargaPista): Resultado {
  e.paso += 1;
  e.fragmentos.push(carga.fragmento);
  if (resuelto(e)) e.fin = Date.now();
  guardarEstado(e);
  return { ok: true, pista: carga.pista, fragmento: carga.fragmento };
}

/**
 * Descifra el desenlace con la palabra compuesta.
 * Decrypts the ending with the assembled word.
 */
export async function desenlace(palabra: string): Promise<string | null> {
  const clave = await derivar(palabra, FINAL.salt);
  const plano = await descifrar(FINAL.iv, FINAL.data, clave);
  if (plano === null) return null;
  try {
    return (JSON.parse(plano) as { texto: string }).texto;
  } catch {
    return null;
  }
}

/**
 * Emite un sello de victoria y lo guarda. / Emits a victory seal and saves it.
 * @param juego - Juego que lo emite. / Emitting game.
 * @returns El sello o null si no aplica. / The seal or null when not applicable.
 */
export function emitirSello(juego: "laberinto" | "tres"): string | null {
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    const sello = `seal-${Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 8)}`;
    const e = leerEstado();
    e.sellos[juego] = sello;
    guardarEstado(e);
    window.dispatchEvent(new CustomEvent("rtw:misterio", { detail: sello }));
    return sello;
  } catch {
    return null;
  }
}
