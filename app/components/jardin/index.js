import { component, routeEvent } from "../../lib/rtw/index.js";
import { abrirMesa, leerEstado, mesas, poemas } from "../../lib/archivo.js";
import { guardarPalabraFase2, verificarFase2 } from "../../lib/fases.js";
import { SALT } from "./datos.js";
function refsDe(shadow) {
    const q = (n) => shadow.querySelector(`[data-ref="${n}"]`);
    const r = {
        poemas: q("poemas"),
        mesa1: q("mesa1"),
        mesa2: q("mesa2"),
        forma1: q("forma1"),
        forma2: q("forma2"),
        fallo1: q("fallo1"),
        fallo2: q("fallo2"),
        desenlace: q("desenlace"),
        puerta: q("puerta"),
        formaPuerta: q("formaPuerta"),
        palabra: q("palabra"),
        falloPuerta: q("falloPuerta"),
        noEncontrado: q("noEncontrado"),
    };
    return Object.values(r).every(Boolean) ? r : null;
}
function esCursiva(t) {
    return t.startsWith("*") && t.endsWith("*");
}
export const Jardin = component("x-jardin", import.meta.url, {
    setup({ shadow, host, onCleanup }) {
        const refs = refsDe(shadow);
        if (!refs)
            return;
        let estado = leerEstado();
        const nodoCursiva = (t) => {
            const em = document.createElement("em");
            em.textContent = t.slice(1, -1);
            return em;
        };
        const nodoOculto = (t) => {
            const span = document.createElement("span");
            span.className = "oculta";
            span.tabIndex = 0;
            span.textContent = t.slice(2, -2);
            return span;
        };
        const nodoEnlace = (t) => {
            const [texto, href] = t.slice(2, -2).split("|");
            const a = document.createElement("a");
            a.href = href ?? "#";
            a.textContent = texto ?? "";
            const ruta = (href ?? "").replace(/^\//, "") || "inicio";
            a.addEventListener("click", (e) => {
                e.preventDefault();
                a.dispatchEvent(routeEvent(ruta));
            });
            return a;
        };
        const parrafoTexto = (texto) => {
            const p = document.createElement("p");
            const trozos = texto.split(/(\*[^*]+\*|\[\[[^\]]+\]\]|\{\{[^}]+\}\})/g);
            for (const t of trozos) {
                if (!t)
                    continue;
                if (esCursiva(t)) {
                    p.appendChild(nodoCursiva(t));
                    continue;
                }
                if (t.startsWith("[[")) {
                    p.appendChild(nodoEnlace(t));
                    continue;
                }
                if (t.startsWith("{{")) {
                    p.appendChild(nodoOculto(t));
                    continue;
                }
                p.appendChild(document.createTextNode(t));
            }
            return p;
        };
        const fichaPoema = (poema) => {
            const li = document.createElement("li");
            li.className = "poema";
            const h = document.createElement("h2");
            h.textContent = poema.titulo;
            const p = parrafoTexto(poema.texto);
            li.append(h, p);
            if (poema.n === poemas().length)
                p.classList.add("cursor");
            return li;
        };
        const pintarPoemas = () => {
            refs.poemas.innerHTML = "";
            for (const poema of poemas())
                refs.poemas.appendChild(fichaPoema(poema));
        };
        const bloque = (titulo, texto) => {
            const art = document.createElement("article");
            const h = document.createElement("h2");
            h.textContent = titulo;
            const p = document.createElement("p");
            p.textContent = texto;
            art.append(h, p);
            return art;
        };
        const claveMesa = (id) => `gacarbla:mesa:${SALT}:${id}`;
        const textoMesa = (id) => {
            try {
                return sessionStorage.getItem(claveMesa(id));
            }
            catch {
                return null;
            }
        };
        const guardarTextoMesa = (id, texto) => {
            try {
                sessionStorage.setItem(claveMesa(id), texto);
            }
            catch {
            }
        };
        const conEco = (texto) => {
            const ahora = new Date();
            const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
            const inicio = leerEstado().inicio;
            const minutos = String(Math.max(1, Math.round((Date.now() - inicio) / 60000)));
            return texto.replace("{hora}", hora).replace("{minutos}", minutos);
        };
        const pintarDesenlace = () => {
            const t1 = textoMesa("mesa-1");
            const t2 = textoMesa("mesa-2");
            refs.desenlace.innerHTML = "";
            if (t1)
                refs.desenlace.appendChild(bloque("Novena hora", t1));
            if (t2)
                refs.desenlace.appendChild(bloque("La décima", conEco(t2)));
            refs.desenlace.toggleAttribute("hidden", !t1 && !t2);
        };
        const actualizarMesas = () => {
            const t1 = textoMesa("mesa-1");
            const t2 = textoMesa("mesa-2");
            refs.mesa1.toggleAttribute("hidden", !!t1);
            refs.mesa2.toggleAttribute("hidden", !t1 || !!t2);
            refs.puerta.toggleAttribute("hidden", !t2);
        };
        const enviarMesa = async (forma, fallo, id) => {
            const mesa = mesas().find((m) => m.id === id);
            if (!mesa)
                return;
            const valores = [...forma.querySelectorAll("input")].map((i) => i.value);
            fallo.textContent = "…";
            const texto = await abrirMesa(estado, mesa, valores);
            estado = leerEstado();
            if (!texto) {
                fallo.textContent = "no abre.";
                return;
            }
            fallo.textContent = "";
            guardarTextoMesa(id, texto);
            actualizarMesas();
            pintarDesenlace();
        };
        const mostrar404 = () => {
            refs.puerta.toggleAttribute("hidden", true);
            refs.noEncontrado.toggleAttribute("hidden", false);
        };
        const enviarPuerta = async (e) => {
            e.preventDefault();
            const palabra = refs.palabra.value.trim();
            if (!palabra) {
                refs.falloPuerta.textContent = "…";
                return;
            }
            refs.falloPuerta.textContent = "…";
            if (!(await verificarFase2(palabra))) {
                mostrar404();
                return;
            }
            guardarPalabraFase2(palabra);
            host.dispatchEvent(routeEvent("umbra"));
        };
        const onForma1 = (e) => {
            e.preventDefault();
            void enviarMesa(refs.forma1, refs.fallo1, "mesa-1");
        };
        const onForma2 = (e) => {
            e.preventDefault();
            void enviarMesa(refs.forma2, refs.fallo2, "mesa-2");
        };
        const onPuerta = (e) => {
            void enviarPuerta(e);
        };
        refs.forma1.addEventListener("submit", onForma1);
        refs.forma2.addEventListener("submit", onForma2);
        refs.formaPuerta.addEventListener("submit", onPuerta);
        onCleanup(() => {
            refs.forma1.removeEventListener("submit", onForma1);
            refs.forma2.removeEventListener("submit", onForma2);
            refs.formaPuerta.removeEventListener("submit", onPuerta);
        });
        pintarPoemas();
        actualizarMesas();
        pintarDesenlace();
    },
});
