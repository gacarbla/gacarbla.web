import { App } from "./lib/rtw/index.js";
import { routes } from "./routes.js";
import { i18n } from "./lang/index.js";
if (document.querySelector("app")) {
    const app = new App(routes, { strategy: { kind: "path" }, fallback: "no-encontrado", i18n, localePrefix: true });
    const TITLE_KEYS = {
        inicio: "inicio.rol",
        experiencia: "experiencia.titulo",
        contacto: "contacto.titulo",
        juegos: "games.titulo",
        cubo: "games.cubo_titulo",
        laberinto: "games.lab_titulo",
        "tres-en-raya": "games.tres_titulo",
    };
    const TITLE_LITERALS = {
        archivo: "El Archivo — GACARBLA",
        linde: "Linde — GACARBLA",
        cauce: "Cauce — GACARBLA",
        umbra: "Umbra — GACARBLA",
        relicario: "Relicario — GACARBLA",
        "no-encontrado": "Página no encontrada — GACARBLA",
    };
    const setTitle = (name) => {
        const key = TITLE_KEYS[name];
        if (key) {
            const text = i18n.t(key);
            document.title = name === "inicio" ? `GACARBLA — ${text}` : `${text} — GACARBLA`;
            return;
        }
        const literal = TITLE_LITERALS[name];
        if (literal)
            document.title = literal;
    };
    app.router.watch((route) => setTitle(route.name));
    i18n.onLang(() => {
        const route = app.router.route;
        if (route)
            setTitle(route.name);
    });
    app.start();
    const idle = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 1500));
    idle(() => {
        void app.router.prefetch("experiencia", "contacto", "juegos", "cubo", "laberinto", "tres-en-raya");
    });
}
