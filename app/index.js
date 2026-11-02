import { App } from "./lib/rtw/index.js";
import { routes } from "./routes.js";
import { i18n } from "./lang/index.js";
if (document.querySelector("app")) {
    const app = new App(routes, { strategy: { kind: "path" }, fallback: "inicio", i18n, localePrefix: true });
    app.start();
    const idle = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 1500));
    idle(() => {
        void app.router.prefetch("experiencia", "contacto", "juegos", "cubo", "laberinto", "tres-en-raya");
    });
}
