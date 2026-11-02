import { component } from "../../lib/rtw/index.js";
import { dibujarCubo, leerTinta } from "./cubo.js";
import { crearLaberinto } from "./laberinto.js";
import { dibujarTres } from "./tres.js";
export const Vista = component("x-vista", import.meta.url, {
    attrs: ["juego"],
    setup({ shadow, host, attr, onCleanup }) {
        const canvas = shadow.querySelector("canvas");
        if (!canvas)
            return;
        const cual = (attr("juego") ?? host.getAttribute("juego") ?? "").toLowerCase();
        const esLab = cual === "laberinto";
        const esTres = cual === "tres";
        const lab = esLab ? crearLaberinto() : null;
        const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const tinta = leerTinta();
        const tarjeta = host.closest(".ficha-juego") ?? host;
        let raf = 0;
        let vivo = false;
        let inicio = 0;
        const ajustar = () => {
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const r = canvas.getBoundingClientRect();
            canvas.width = Math.max(1, Math.round(r.width * dpr));
            canvas.height = Math.max(1, Math.round(r.height * dpr));
        };
        const pintar = (ahora, antes) => {
            const g = canvas.getContext("2d");
            if (!g)
                return;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            const r = canvas.getBoundingClientRect();
            if (lab)
                lab.dibujar(g, r.width, r.height, Math.min(0.05, Math.max(0, (ahora - antes) / 1000)), tinta);
            else if (esTres)
                dibujarTres(g, r.width, r.height, (ahora - inicio) / 1000, tinta);
            else
                dibujarCubo(g, r.width, r.height, (ahora - inicio) / 1000, tinta);
        };
        const poster = () => {
            ajustar();
            const g = canvas.getContext("2d");
            if (!g)
                return;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            const r = canvas.getBoundingClientRect();
            if (lab)
                lab.dibujar(g, r.width, r.height, 0, tinta);
            else if (esTres)
                dibujarTres(g, r.width, r.height, 2.0, tinta);
            else
                dibujarCubo(g, r.width, r.height, 0.41, tinta);
        };
        const reproducir = () => {
            if (vivo || quieto)
                return;
            ajustar();
            window.addEventListener("resize", ajustar);
            vivo = true;
            inicio = performance.now();
            let antes = inicio;
            const paso = (ahora) => {
                if (!vivo)
                    return;
                pintar(ahora, antes);
                antes = ahora;
                raf = requestAnimationFrame(paso);
            };
            raf = requestAnimationFrame(paso);
        };
        const pausar = () => {
            vivo = false;
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", ajustar);
            poster();
        };
        poster();
        tarjeta.addEventListener("mouseenter", reproducir);
        tarjeta.addEventListener("mouseleave", pausar);
        tarjeta.addEventListener("focusin", reproducir);
        tarjeta.addEventListener("focusout", pausar);
        onCleanup(() => {
            vivo = false;
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", ajustar);
            tarjeta.removeEventListener("mouseenter", reproducir);
            tarjeta.removeEventListener("mouseleave", pausar);
            tarjeta.removeEventListener("focusin", reproducir);
            tarjeta.removeEventListener("focusout", pausar);
        });
    },
});
