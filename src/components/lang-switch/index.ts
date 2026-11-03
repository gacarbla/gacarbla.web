import { component, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { IDIOMAS, type Idioma } from "../../lang/idiomas.js";

/**
 * Selector de idioma con búsqueda y banderas reales. En escritorio vive
 * en la barra; en móvil, dentro del menú. Los idiomas gatuno solo
 * aparecen si la búsqueda contiene «miau» o «meow».
 * Language selector with search and real flags. On desktop it lives in
 * the bar; on mobile, inside the menu. Cat languages only appear when
 * the search contains "miau" or "meow".
 *
 * Uso / Usage: <x-lang-switch class="lang-desktop|lang-mobile"></x-lang-switch>.
 */

/** Refs del selector. / Selector refs. */
interface Refs {
  trigger: HTMLButtonElement;
  flag: HTMLImageElement;
  nombre: HTMLElement;
  corto: HTMLElement;
  panel: HTMLElement;
  search: HTMLInputElement;
  list: HTMLElement;
  empty: HTMLElement;
}

/**
 * Recoge las refs. / Collects the refs.
 * @param shadow - Raíz sombra. / Shadow root.
 * @returns Refs completas o null. / Full refs or null.
 */
function refsDe(shadow: ShadowRoot): Refs | null {
  const q = <T extends Element = HTMLElement>(n: string): T | null =>
    shadow.querySelector(`[data-ref="${n}"]`) as T | null;
  const r = {
    trigger: q<HTMLButtonElement>("trigger"),
    flag: q<HTMLImageElement>("flag"),
    nombre: q("nombre"),
    corto: q("corto"),
    panel: q("panel"),
    search: q<HTMLInputElement>("search"),
    list: q("list"),
    empty: q("empty"),
  };
  return Object.values(r).every(Boolean) ? (r as Refs) : null;
}

/**
 * Pliega tildes y mayúsculas para buscar. / Folds accents and case for search.
 * @param texto - Texto crudo. / Raw text.
 * @returns Texto plegado. / Folded text.
 */
function plegar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const LangSwitch = component("x-lang-switch", import.meta.url, {
  setup({ shadow, host, onCleanup }: SetupCtx) {
    const refs = refsDe(shadow);
    if (!refs) return;
    const stopI18n = i18n.apply(shadow);
    onCleanup(stopI18n);

    /** Idioma activo. / Active language. */
    const actual = (): Idioma => IDIOMAS.find((i) => i.code === i18n.lang.value) ?? IDIOMAS[0];

    /** Pinta la bandera y el nombre del botón. / Paints the trigger flag and name. */
    const pintarTrigger = (): void => {
      const idioma = actual();
      refs.flag.src = idioma.bandera;
      refs.nombre.textContent = idioma.nombre;
      refs.corto.textContent = idioma.corto;
      refs.trigger.setAttribute("aria-label", `${i18n.t("lang.etiqueta")}: ${idioma.nombre}`);
    };

    /**
     * ¿El idioma entra en la búsqueda? Los gatuno solo con su gatillo.
     * Does the language match the search? Cat ones only with their trigger.
     */
    const coincide = (idioma: Idioma, q: string): boolean => {
      if (idioma.gato) return q.includes(idioma.gato);
      if (!q) return true;
      return plegar(`${idioma.nombre} ${idioma.corto} ${idioma.code} ${idioma.alias.join(" ")}`).includes(q);
    };

    /** Cierra el panel. / Closes the panel. */
    const cerrar = (): void => {
      refs.panel.toggleAttribute("hidden", true);
      refs.trigger.setAttribute("aria-expanded", "false");
      refs.search.value = "";
    };

    /** Elige un idioma y cierra. / Picks a language and closes. */
    const elegir = (idioma: Idioma): void => {
      i18n.useLang(idioma.code);
      cerrar();
      refs.trigger.focus();
    };

    /** Crea una opción de la lista. / Builds one list option. */
    const opcion = (idioma: Idioma): HTMLButtonElement => {
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

    /** Pinta la lista filtrada. / Paints the filtered list. */
    const pintarLista = (): void => {
      const q = plegar(refs.search.value.trim());
      refs.list.innerHTML = "";
      let n = 0;
      for (const idioma of IDIOMAS) {
        if (!coincide(idioma, q)) continue;
        refs.list.appendChild(opcion(idioma));
        n++;
      }
      refs.empty.toggleAttribute("hidden", n > 0);
    };

    /** Abre el panel y enfoca la búsqueda. / Opens the panel and focuses search. */
    const abrir = (): void => {
      refs.panel.toggleAttribute("hidden", false);
      refs.trigger.setAttribute("aria-expanded", "true");
      refs.search.value = "";
      pintarLista();
      refs.search.focus();
    };

    /** Alterna el panel. / Toggles the panel. */
    const alternar = (): void => {
      if (refs.panel.hasAttribute("hidden")) abrir();
      else cerrar();
    };

    const onTrigger = (): void => alternar();
    const onSearch = (): void => pintarLista();

    /** Teclado de la búsqueda. / Search keyboard. */
    const onKeySearch = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cerrar();
        refs.trigger.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "Enter") return;
      const first = refs.list.querySelector<HTMLButtonElement>(".opcion");
      if (!first) return;
      e.preventDefault();
      first.focus();
    };

    /** Flechas dentro de la lista. / Arrow keys inside the list. */
    const onKeyList = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cerrar();
        refs.trigger.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = [...refs.list.querySelectorAll<HTMLButtonElement>(".opcion")];
      const i = items.indexOf(e.target as HTMLButtonElement);
      if (i < 0) return;
      e.preventDefault();
      const next = e.key === "ArrowDown" ? items[i + 1] : items[i - 1];
      next?.focus();
    };

    /** Cierra al pulsar fuera. / Closes on outside press. */
    const onDoc = (e: PointerEvent): void => {
      if (refs.panel.hasAttribute("hidden")) return;
      if (e.composedPath().includes(host)) return;
      cerrar();
    };

    /** Repinta al cambiar de idioma. / Repaints on language change. */
    const onLang = (): void => {
      pintarTrigger();
      if (!refs.panel.hasAttribute("hidden")) pintarLista();
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
