import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";

/**
 * Conmutador de idioma: un botón por idioma del I18n, con el activo
 * marcado. Se repinta solo al cambiar de idioma.
 * Language switcher: one button per I18n language, active marked.
 * Repaints only on language change.
 *
 * Uso / Usage: <x-lang-switch></x-lang-switch> (tras importar LangSwitch / after importing LangSwitch)
 */
export const LangSwitch = component("x-lang-switch", import.meta.url, {
  setup({ shadow, onCleanup }: SetupCtx) {
    const box = shadow.querySelector(".langs");
    if (!box) return;
    /**
     * Pinta un botón por idioma y marca el activo.
     * Paints one button per language and marks the active one.
     */
    const paint = (): void => {
      box.innerHTML = "";
      for (const lang of i18n.languages) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = lang.toUpperCase();
        b.classList.toggle("on", lang === i18n.lang.value);
        b.setAttribute("aria-label", lang);
        b.addEventListener("click", () => i18n.use(lang));
        box.appendChild(b);
      }
    };
    paint();
    const stop = i18n.onLang(paint);
    onCleanup(stop);
  },
});
