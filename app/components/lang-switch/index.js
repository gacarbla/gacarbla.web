import { component } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { IDIOMAS } from "../../lang/idiomas.js";
function refsDe(shadow) {
    const q = (n) => shadow.querySelector(`[data-ref="${n}"]`);
    const r = {
        trigger: q("trigger"),
        flag: q("flag"),
        nombre: q("nombre"),
        corto: q("corto"),
        panel: q("panel"),
        search: q("search"),
        list: q("list"),
        empty: q("empty"),
    };
    return Object.values(r).every(Boolean) ? r : null;
}
function plegar(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
export const LangSwitch = component("x-lang-switch", import.meta.url, {
    setup({ shadow, host, onCleanup }) {
        const refs = refsDe(shadow);
        if (!refs)
            return;
        const stopI18n = i18n.apply(shadow);
        onCleanup(stopI18n);
        const actual = () => IDIOMAS.find((i) => i.code === i18n.lang.value) ?? IDIOMAS[0];
        const pintarTrigger = () => {
            const idioma = actual();
            refs.flag.src = idioma.bandera;
            refs.nombre.textContent = idioma.nombre;
            refs.corto.textContent = idioma.corto;
            refs.trigger.setAttribute("aria-label", `${i18n.t("lang.etiqueta")}: ${idioma.nombre}`);
        };
        const coincide = (idioma, q) => {
            if (idioma.gato)
                return q.includes(idioma.gato);
            if (!q)
                return true;
            return plegar(`${idioma.nombre} ${idioma.corto} ${idioma.code} ${idioma.alias.join(" ")}`).includes(q);
        };
        const cerrar = () => {
            refs.panel.toggleAttribute("hidden", true);
            refs.trigger.setAttribute("aria-expanded", "false");
            refs.search.value = "";
        };
        const elegir = (idioma) => {
            i18n.useLang(idioma.code);
            cerrar();
            refs.trigger.focus();
        };
        const opcion = (idioma) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "opcion";
            b.setAttribute("role", "option");
            b.setAttribute("aria-selected", String(idioma.code === i18n.lang.value));
            const img = document.createElement("img");
            img.className = "flag";
            img.src = idioma.bandera;
            img.alt = "";
            img.draggable = false;
            img.width = 21;
            img.height = 14;
            const nombre = document.createElement("span");
            nombre.className = "opcion-nombre";
            nombre.textContent = idioma.nombre;
            const corto = document.createElement("span");
            corto.className = "opcion-corto";
            corto.textContent = idioma.corto;
            b.append(img, nombre, corto);
            b.addEventListener("click", () => elegir(idioma));
            return b;
        };
        const pintarLista = () => {
            const q = plegar(refs.search.value.trim());
            refs.list.innerHTML = "";
            let n = 0;
            for (const idioma of IDIOMAS) {
                if (!coincide(idioma, q))
                    continue;
                refs.list.appendChild(opcion(idioma));
                n++;
            }
            refs.empty.toggleAttribute("hidden", n > 0);
        };
        const abrir = () => {
            refs.panel.toggleAttribute("hidden", false);
            refs.trigger.setAttribute("aria-expanded", "true");
            refs.search.value = "";
            pintarLista();
            refs.search.focus();
        };
        const alternar = () => {
            if (refs.panel.hasAttribute("hidden"))
                abrir();
            else
                cerrar();
        };
        const onTrigger = () => alternar();
        const onSearch = () => pintarLista();
        const onKeySearch = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                cerrar();
                refs.trigger.focus();
                return;
            }
            if (e.key !== "ArrowDown" && e.key !== "Enter")
                return;
            const first = refs.list.querySelector(".opcion");
            if (!first)
                return;
            e.preventDefault();
            first.focus();
        };
        const onKeyList = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                cerrar();
                refs.trigger.focus();
                return;
            }
            if (e.key !== "ArrowDown" && e.key !== "ArrowUp")
                return;
            const items = [...refs.list.querySelectorAll(".opcion")];
            const i = items.indexOf(e.target);
            if (i < 0)
                return;
            e.preventDefault();
            const next = e.key === "ArrowDown" ? items[i + 1] : items[i - 1];
            next?.focus();
        };
        const onDoc = (e) => {
            if (refs.panel.hasAttribute("hidden"))
                return;
            if (e.composedPath().includes(host))
                return;
            cerrar();
        };
        const onLang = () => {
            pintarTrigger();
            if (!refs.panel.hasAttribute("hidden"))
                pintarLista();
        };
        refs.trigger.addEventListener("click", onTrigger);
        refs.search.addEventListener("input", onSearch);
        refs.search.addEventListener("keydown", onKeySearch);
        refs.list.addEventListener("keydown", onKeyList);
        document.addEventListener("pointerdown", onDoc);
        const stopLang = i18n.onLang(onLang);
        onCleanup(() => {
            refs.trigger.removeEventListener("click", onTrigger);
            refs.search.removeEventListener("input", onSearch);
            refs.search.removeEventListener("keydown", onKeySearch);
            refs.list.removeEventListener("keydown", onKeyList);
            document.removeEventListener("pointerdown", onDoc);
            stopLang();
        });
        pintarTrigger();
    },
});
