import { component, routeEvent, type SetupCtx } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { insigniaGanada } from "../../lib/fases.js";

/**
 * Navegación principal. Marca el enlace de la ruta actual.
 * Main navigation. Highlights the current route link.
 *
 * Uso / Usage: <x-navigation></x-navigation> (tras importar Navigation / after importing Navigation)
 */
export const Navigation = component("x-navigation", import.meta.url, {
  setup({ shadow, onCleanup }: SetupCtx) {
    const stopI18n = i18n.apply(shadow);
    onCleanup(stopI18n);
    const nav = shadow.querySelector("nav");
    const burger = shadow.querySelector("#burger") as HTMLButtonElement | null;
    nav?.setAttribute("data-js", "");
    /**
     * Insignia del archivo: solo aparece cuando la fase 3 se completa.
     * Archive badge: only shown once phase 3 is completed.
     */
    const insignia = shadow.querySelector('[data-ref="insignia"]');
    const pintarInsignia = (): void => {
      insignia?.toggleAttribute("hidden", !insigniaGanada());
    };
    pintarInsignia();
    window.addEventListener("gacarbla:insignia", pintarInsignia);
    onCleanup(() => window.removeEventListener("gacarbla:insignia", pintarInsignia));
    /**
     * Mide la cabecera fija y la compensa en el body (sin saltos al
     * cargar la fuente o rotar). Con fallback CSS si falla.
     * Measures the fixed header and offsets the body (no jumps on
     * font load or rotation). CSS fallback otherwise.
     */
    const medir = (): void => {
      const h = nav?.getBoundingClientRect().height ?? 0;
      if (h > 0) document.documentElement.style.setProperty("--header-h", `${Math.ceil(h)}px`);
    };
    medir();
    window.addEventListener("resize", medir);
    onCleanup(() => window.removeEventListener("resize", medir));
    /**
     * Abre/cierra el menú móvil con estado accesible y scroll bloqueado.
     * Opens/closes the mobile menu with accessible state and locked scroll.
     */
    const setOpen = (open: boolean): void => {
      if (open) nav?.setAttribute("data-open", "");
      else nav?.removeAttribute("data-open");
      burger?.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    const onBurger = (): void => {
      setOpen(nav?.hasAttribute("data-open") !== true);
    };
    burger?.addEventListener("click", onBurger);
    onCleanup(() => burger?.removeEventListener("click", onBurger));
    /**
     * Escape cierra; navegar también (el menú no tapa la page nueva).
     * Escape closes; navigating too (menu must not cover the new page).
     */
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
    onCleanup(() => {
      document.body.style.overflow = "";
    });
    const links = [...shadow.querySelectorAll(".links a, .brand")];
    /**
     * Marca el enlace cuyo data-go coincide (los demás se apagan).
     * Highlights the link whose data-go matches (others turn off).
     */
    const marcar = (name: string): void => {
      for (const a of links) {
        a.classList.toggle("activo", a.getAttribute("data-go") === name);
      }
    };
    /**
     * Puente del evento global "rtw:route" al marcado local.
     * Bridges the global "rtw:route" event into local marking.
     */
    const onRoute = (e: Event): void => {
      marcar((e as CustomEvent<string>).detail);
      setOpen(false);
    };
    /**
     * Clic en sombra: se despacha rtw:go (compuesto, atraviesa al documento)
     * porque el router no puede ver el <a> re-objetivado. El href queda
     * como fallback sin JS.
     * Shadow click: dispatches rtw:go (composed, reaches the document)
     * because the router cannot see the retargeted <a>. Href stays
     * as the no-JS fallback.
     */
    for (const a of links) {
      a.addEventListener("click", (e) => {
        const name = a.getAttribute("data-go") ?? "";
        if (!name) return;
        e.preventDefault();
        setOpen(false);
        a.dispatchEvent(routeEvent(name));
      });
    }
    window.addEventListener("rtw:route", onRoute);
    onCleanup(() => window.removeEventListener("rtw:route", onRoute));
    /**
     * Marco secreto: el botón derecho sobre "Inicio" abre El Archivo.
     * Secret frame: right-clicking "Inicio" opens The Archive.
     */
    const inicio = shadow.querySelector('.links a[data-go="inicio"]');
    const onContexto = (e: Event): void => {
      e.preventDefault();
      inicio?.dispatchEvent(routeEvent("archivo"));
    };
    inicio?.addEventListener("contextmenu", onContexto);
    onCleanup(() => inicio?.removeEventListener("contextmenu", onContexto));
  },
});
