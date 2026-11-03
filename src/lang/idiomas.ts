import type { Lang } from "./index.js";

/**
 * Metadata del selector: nombre nativo, bandera real (PNG) y alias de
 * búsqueda. Los idiomas gatuno no salen en la lista normal: se muestran
 * solo cuando la búsqueda contiene su gatillo.
 * Selector metadata: native name, real flag (PNG) and search aliases.
 * Cat languages stay out of the normal list: they only appear when the
 * search contains their trigger.
 */
export interface Idioma {
  /** Código de diccionario y prefijo de URL. / Dictionary code and URL prefix. */
  code: Lang;
  /** Nombre nativo. / Native name. */
  nombre: string;
  /** Código corto para el botón. / Short code for the button. */
  corto: string;
  /** Bandera PNG real. / Real PNG flag. */
  bandera: string;
  /** Alias para buscar sin tildes. / Aliases for accentless search. */
  alias: readonly string[];
  /** Gatillo de los idiomas gatuno. / Cat-language trigger. */
  gato?: "miau" | "meow";
}

/** Idiomas del selector, en orden de aparición. / Selector languages, in display order. */
export const IDIOMAS: readonly Idioma[] = [
  {
    code: "es",
    nombre: "Español",
    corto: "ES",
    bandera: "/assets/flags/es.png",
    alias: ["espanol", "spanish", "spain"],
  },
  {
    code: "en",
    nombre: "English",
    corto: "EN",
    bandera: "/assets/flags/gb.png",
    alias: ["ingles", "english", "uk"],
  },
  {
    code: "gl",
    nombre: "Galego",
    corto: "GL",
    bandera: "/assets/flags/galicia.png",
    alias: ["galego", "gallego", "galician"],
  },
  {
    code: "pt",
    nombre: "Português (Portugal)",
    corto: "PT",
    bandera: "/assets/flags/pt.png",
    alias: ["portugues", "portugal", "pt-pt"],
  },
  {
    code: "pt-BR",
    nombre: "Português (Brasil)",
    corto: "BR",
    bandera: "/assets/flags/br.png",
    alias: ["portugues", "brasil", "brazil", "pt-br"],
  },
  {
    code: "fr",
    nombre: "Français (France)",
    corto: "FR",
    bandera: "/assets/flags/fr.png",
    alias: ["frances", "francais", "france"],
  },
  {
    code: "it",
    nombre: "Italiano",
    corto: "IT",
    bandera: "/assets/flags/it.png",
    alias: ["italiano", "italy", "italia"],
  },
  {
    code: "es-cat",
    nombre: "Español gatuno",
    corto: "MIAU",
    bandera: "/assets/flags/es.png",
    alias: [],
    gato: "miau",
  },
  {
    code: "en-cat",
    nombre: "English cat",
    corto: "MEOW",
    bandera: "/assets/flags/gb.png",
    alias: [],
    gato: "meow",
  },
];
