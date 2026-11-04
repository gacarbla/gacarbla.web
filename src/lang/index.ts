import { I18n } from "../lib/rtw/index.js";
import { en } from "./en.js";
import { enCat } from "./en-cat.js";
import { es } from "./es.js";
import { esCat } from "./es-cat.js";
import { fr } from "./fr.js";
import { gl } from "./gl.js";
import { it } from "./it.js";
import { pt } from "./pt.js";
import { ptBR } from "./pt-br.js";

/**
 * Diccionarios de la web. Los dos últimos son idiomas gatuno de broma:
 * no se detectan solos y solo aparecen al buscar «miau» o «meow».
 * Site dictionaries. The last two are joke cat languages: never
 * auto-detected and only shown when searching for "miau" or "meow".
 */
const dicts = {
  es,
  en,
  gl,
  pt,
  "pt-BR": ptBR,
  fr,
  it,
  "es-cat": esCat,
  "en-cat": enCat,
};

/**
 * Instancia compartida: intenta el idioma del navegador y, si no,
 * queda en español. La URL con prefijo de idioma recuerda la elección.
 * Shared instance: tries the browser language, otherwise Spanish.
 * The locale-prefixed URL remembers the choice.
 */
export const i18n = new I18n({ dicts }).autodetectLang(true).defaultLang("es");

/** Idiomas disponibles. / Available languages. */
export type Lang = keyof typeof dicts;

/**
 * Código BCP 47 para <html lang>. `pt` es portugués de Portugal.
 * BCP 47 code for <html lang>. `pt` is European Portuguese.
 */
const HTML_LANG: Record<Lang, string> = {
  es: "es",
  en: "en",
  gl: "gl",
  pt: "pt-PT",
  "pt-BR": "pt-BR",
  fr: "fr",
  it: "it",
  "es-cat": "es",
  "en-cat": "en",
};

if (typeof document !== "undefined") {
  i18n.onLang((lang) => {
    document.documentElement.lang = HTML_LANG[lang] ?? lang;
  });
}
