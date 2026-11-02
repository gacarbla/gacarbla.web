import { component } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
export const LangSwitch = component("x-lang-switch", import.meta.url, {
    setup({ shadow, onCleanup }) {
        const box = shadow.querySelector(".langs");
        if (!box)
            return;
        const paint = () => {
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
