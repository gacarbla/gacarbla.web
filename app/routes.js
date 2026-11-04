import { Routes } from "./lib/rtw/index.js";
export const routes = [
    Routes.route("inicio")
        .at("/")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .fade()
        .page(async () => {
        const m = await import("./pages/inicio/index.js");
        return { mount: (el) => m.mountInicio(el) };
    }),
    Routes.route("experiencia")
        .at("/experiencia")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .slide()
        .onlyFrom("inicio")
        .page(async () => {
        const m = await import("./pages/experiencia/index.js");
        return { mount: (el) => m.mountExperiencia(el) };
    }),
    Routes.route("contacto")
        .at("/contacto")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .fade()
        .slideFrom("experiencia")
        .page(async () => {
        const m = await import("./pages/contacto/index.js");
        return { mount: (el) => m.mountContacto(el) };
    }),
    Routes.route("juegos")
        .at("/games")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .fade()
        .page(async () => {
        const m = await import("./pages/games/index.js");
        return { mount: (el) => m.mountJuegos(el) };
    }),
    Routes.route("cubo")
        .at("/games/cubo")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .fade()
        .slideFrom("juegos")
        .page(async () => {
        const m = await import("./pages/cubo/index.js");
        return { mount: (el) => m.mountCubo(el) };
    }),
    Routes.route("laberinto")
        .at("/games/laberinto")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .fade()
        .slideFrom("juegos")
        .page(async () => {
        const m = await import("./pages/laberinto/index.js");
        return { mount: (el) => m.mountLaberinto(el) };
    }),
    Routes.route("tres-en-raya")
        .at("/games/tres-en-raya")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .fade()
        .slideFrom("juegos")
        .page(async () => {
        const m = await import("./pages/tres-en-raya/index.js");
        return { mount: (el) => m.mountTres(el) };
    }),
    Routes.route("archivo")
        .at("/jardin")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .none()
        .page(async () => {
        const m = await import("./pages/jardin/index.js");
        return { mount: (el) => m.mountJardin(el) };
    }),
    Routes.route("linde")
        .at("/linde")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .none()
        .page(async () => {
        const m = await import("./pages/linde/index.js");
        return { mount: (el) => m.mountLinde(el) };
    }),
    Routes.route("cauce")
        .at("/cauce/3")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .none()
        .page(async () => {
        const m = await import("./pages/cauce/index.js");
        return { mount: (el) => m.mountCauce(el) };
    }),
    Routes.route("umbra")
        .at("/umbra")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .none()
        .page(async () => {
        const m = await import("./pages/umbra/index.js");
        return { mount: (el) => m.mountUmbra(el) };
    }),
    Routes.route("relicario")
        .at("/relicario")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .none()
        .page(async () => {
        const m = await import("./pages/relicario/index.js");
        return { mount: (el) => m.mountRelicario(el) };
    }),
    Routes.route("no-encontrado")
        .at("/404")
        .layout("main", async () => {
        const m = await import("./layouts/main/index.js");
        return { mount: (el) => m.mountMain(el) };
    })
        .none()
        .page(async () => {
        const m = await import("./pages/404/index.js");
        return { mount: (el) => m.mountNoEncontrado(el) };
    }),
];
