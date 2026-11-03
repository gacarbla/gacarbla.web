import { HASHES, MESAS, POEMAS, SALT, SECCIONES, type Mesa } from "../components/jardin/datos.js";
import { claveDe, descifrar, huella, lp, normalizar } from "./cripto.js";

/**
 * El Archivo: poemas públicos, verificación de tokens por hash y mesas
 * cifradas que solo se abren combinando cuatro respuestas.
 * The Archive: public poems, token verification by hash and encrypted
 * tables that only open by combining four answers.
 */

/** Clave de guardado. / Save key. */
const CLAVE = "gacarbla:archivo";
/** Versión del formato. / Format version. */
const VERSION = 3;

/** Guardado: solo lo resuelto, nunca los tokens. / Save: only what is solved, never tokens. */
export interface Estado {
  version: number;
  mesas: string[];
  inicio: number;
  fin: number;
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
 * @returns Estado guardado o uno nuevo. / Saved state or a new one.
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
 * @param e - Estado vivo. / Live state.
 */
export function guardarEstado(e: Estado): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    /* guardado opcional / optional save */
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

/** Sección secreta por id. / Secret section by id. */
export function seccion(id: string) {
  return SECCIONES[id] ?? null;
}

/**
 * ¿Las cuatro respuestas corresponden a los poemas de la mesa?
 * Do the four answers match the table poems?
 * @param mesa - Mesa. / Table.
 * @param respuestas - Respuestas en orden de poema. / Answers in poem order.
 * @returns true si todas valen. / true when all match.
 */
async function todasValidas(mesa: Mesa, respuestas: string[]): Promise<boolean> {
  if (respuestas.length !== mesa.poemas.length) return false;
  for (let i = 0; i < mesa.poemas.length; i++) {
    if (!(await tokenValido(mesa.poemas[i] as number, respuestas[i] as string))) return false;
  }
  return true;
}

/**
 * ¿El token corresponde a ese poema? / Does the token match that poem?
 * @param n - Número de poema. / Poem number.
 * @param texto - Respuesta. / Answer.
 * @returns true si coincide. / true when it matches.
 */
export async function tokenValido(n: number, texto: string): Promise<boolean> {
  const esperado = HASHES[n];
  if (!esperado || !normalizar(texto)) return false;
  return (await huella(texto)) === esperado;
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
    const clave = await claveDe(lp(respuestas), info, SALT);
    const plano = await descifrar({ iv: mesa.iv, data: mesa.data }, clave);
    if (!e.mesas.includes(mesa.id)) e.mesas.push(mesa.id);
    if (abierta(e, "mesa-2")) e.fin = Date.now();
    guardarEstado(e);
    return plano;
  } catch {
    return null;
  }
}

/** Mesas con sus poemas. / Tables with their poems. */
export function mesas(): readonly Mesa[] {
  return MESAS;
}
