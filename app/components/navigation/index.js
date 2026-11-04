import { component, routeEvent } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { insigniaGanada } from "../../lib/fases.js";
export const Navigation = component("x-navigation", import.meta.url, {
    setup({ shadow, onCleanup }) {
        const stopI18n = i18n.apply(shadow);
        onCleanup(stopI18n);
        const nav = shadow.querySelector("nav");
        const burger = shadow.querySelector("#burger");
        nav?.setAttribute("data-js", "");
        const insignia = shadow.querySelector('[data-ref="insignia"]');
        const pintarInsignia = () => {
            insignia?.toggleAttribute("hidden", !insigniaGanada());
        };
        pintarInsignia();
        window.addEventListener("gacarbla:insignia", pintarInsignia);
        onCleanup(() => window.removeEventListener("gacarbla:insignia", pintarInsignia));
        const medir = () => {
            const h = nav?.getBoundingClientRect().height ?? 0;
            if (h > 0)
                document.documentElement.style.setProperty("--header-h", `${Math.ceil(h)}px`);
        };
        medir();
        window.addEventListener("resize", medir);
        onCleanup(() => window.removeEventListener("resize", medir));
        const setOpen = (open) => {
            if (open)
                nav?.setAttribute("data-open", "");
            else
                nav?.removeAttribute("data-open");
            burger?.setAttribute("aria-expanded", String(open));
            document.body.style.overflow = open ? "hidden" : "";
        };
        const onBurger = () => {
            setOpen(nav?.hasAttribute("data-open") !== true);
        };
        burger?.addEventListener("click", onBurger);
        onCleanup(() => burger?.removeEventListener("click", onBurger));
        const onKey = (e) => {
            if (e.key === "Escape")
                setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        onCleanup(() => window.removeEventListener("keydown", onKey));
        onCleanup(() => {
            document.body.style.overflow = "";
        });
        const links = [...shadow.querySelectorAll(".links a, .brand")];
        const rutasNav = {
            inicio: "",
            experiencia: "experiencia",
            contacto: "contacto",
        };
        const actualizarHrefs = () => {
            const base = `/${i18n.currentLang()}/`;
            for (const a of links) {
                const go = a.getAttribute("data-go") ?? "";
                const ruta = rutasNav[go];
                if (ruta === undefined)
                    continue;
                a.setAttribute("href", ruta ? `${base}${ruta}/` : base);
            }
        };
        actualizarHrefs();
        const stopHrefs = i18n.onLang(actualizarHrefs);
        onCleanup(stopHrefs);
        const marcar = (name) => {
            for (const a of links) {
                a.classList.toggle("activo", a.getAttribute("data-go") === name);
            }
        };
        const onRoute = (e) => {
            marcar(e.detail);
            setOpen(false);
        };
        for (const a of links) {
            a.addEventListener("click", (e) => {
                const name = a.getAttribute("data-go") ?? "";
                if (!name)
                    return;
                e.preventDefault();
                setOpen(false);
                a.dispatchEvent(routeEvent(name));
            });
        }
        window.addEventListener("rtw:route", onRoute);
        onCleanup(() => window.removeEventListener("rtw:route", onRoute));
        const inicio = shadow.querySelector('.links a[data-go="inicio"]');
        const onContexto = (e) => {
            e.preventDefault();
            inicio?.dispatchEvent(routeEvent("archivo"));
        };
        inicio?.addEventListener("contextmenu", onContexto);
        onCleanup(() => inicio?.removeEventListener("contextmenu", onContexto));
    },
});
