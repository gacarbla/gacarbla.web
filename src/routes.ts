import { Routes } from "./lib/rtw/index.js";

/**
 * Única fuente de rutas Y transiciones: nombre, layout, page, efecto y carga.
 * Single source of routes AND transitions: name, layout, page, effect and load.
 */
export const routes = [
  Routes.route("inicio")
    .at("/")
    .layout("main", async () => {
      const m = await import("./layouts/main/index.js");
      return { mount: (el: Element) => m.mountMain(el) };
    })
    .fade()
    .page(async () => {
      const m = await import("./pages/inicio/index.js");
      return { mount: (el: Element) => m.mountInicio(el) };
    }),
  Routes.route("experiencia")
    .at("/experiencia")
    .layout("main", async () => {
      const m = await import("./layouts/main/index.js");
      return { mount: (el: Element) => m.mountMain(el) };
    })
    .slide()
    .onlyFrom("inicio")
    .page(async () => {
      const m = await import("./pages/experiencia/index.js");
      return { mount: (el: Element) => m.mountExperiencia(el) };
    }),
  Routes.route("contacto")
    .at("/contacto")
    .layout("main", async () => {
      const m = await import("./layouts/main/index.js");
      return { mount: (el: Element) => m.mountMain(el) };
    })
    .fade()
    .slideFrom("experiencia")
    .page(async () => {
      const m = await import("./pages/contacto/index.js");
      return { mount: (el: Element) => m.mountContacto(el) };
    }),
  Routes.route("juegos")
    .at("/games")
    .layout("main", async () => {
      const m = await import("./layouts/main/index.js");
      return { mount: (el: Element) => m.mountMain(el) };
    })
    .fade()
    .page(async () => {
      const m = await import("./pages/games/index.js");
      return { mount: (el: Element) => m.mountJuegos(el) };
    }),
  Routes.route("cubo")
    .at("/games/cubo")
    .layout("main", async () => {
      const m = await import("./layouts/main/index.js");
      return { mount: (el: Element) => m.mountMain(el) };
    })
    .fade()
    .slideFrom("juegos")
    .page(async () => {
      const m = await import("./pages/cubo/index.js");
      return { mount: (el: Element) => m.mountCubo(el) };
    }),
  Routes.route("laberinto")
    .at("/games/laberinto")
    .layout("main", async () => {
      const m = await import("./layouts/main/index.js");
      return { mount: (el: Element) => m.mountMain(el) };
    })
    .fade()
    .slideFrom("juegos")
    .page(async () => {
      const m = await import("./pages/laberinto/index.js");
      return { mount: (el: Element) => m.mountLaberinto(el) };
    }),
  Routes.route("tres-en-raya")
    .at("/games/tres-en-raya")
    .layout("main", async () => {
      const m = await import("./layouts/main/index.js");
      return { mount: (el: Element) => m.mountMain(el) };
    })
    .fade()
    .slideFrom("juegos")
    .page(async () => {
      const m = await import("./pages/tres-en-raya/index.js");
      return { mount: (el: Element) => m.mountTres(el) };
    }),
  Routes.route("archivo")
    .at("/archivo")
    .layout("main", async () => {
      const m = await import("./layouts/main/index.js");
      return { mount: (el: Element) => m.mountMain(el) };
    })
    .fade()
    .page(async () => {
      const m = await import("./pages/archivo/index.js");
      return { mount: (el: Element) => m.mountArchivo(el) };
    }),
] as const;
