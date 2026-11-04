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
export const i18n = new I18n({ dicts }).autodetectLang(true).defaultLang("es");
const HTML_LANG = {
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
