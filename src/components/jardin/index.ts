import { component, routeEvent, type SetupCtx } from "../../lib/rtw/index.js";
import { abrirMesa, leerEstado, mesas, poemas, type Estado } from "../../lib/archivo.js";
import { guardarPalabraFase2, verificarFase2 } from "../../lib/fases.js";
import type { Poema } from "./datos.js";

/**
 * El Archivo: los poemas que el sitio no firmó. Se entra por el menú
 * contextual de "Inicio". Los poemas 1–4 abren el 9; 5–8 abren el 10;
 * el 10 entrega la palabra que abre la fase 2. Sin menús, sin contadores.
 * The Archive: the poems the site never signed. Entered through the
 * "Inicio" context menu. Poems 1–4 open 9; 5–8 open 10; 10 hands over
 * the word that opens phase 2. No menus, no counters.
 *
 * Uso / Usage: <x-jardin></x-jardin> en /jardin.
 */

/** Refs del archivo. / Archive refs. */
interface Refs {
  poemas: HTMLElement;
  mesa1: HTMLElement;
  mesa2: HTMLElement;
  forma1: HTMLFormElement;
  forma2: HTMLFormElement;
  fallo1: HTMLElement;
  fallo2: HTMLElement;
  desenlace: HTMLElement;
  puerta: HTMLElement;
  formaPuerta: HTMLFormElement;
  palabra: HTMLInputElement;
  falloPuerta: HTMLElement;
  noEncontrado: HTMLElement;
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
    poemas: q("poemas"),
    mesa1: q("mesa1"),
    mesa2: q("mesa2"),
    forma1: q<HTMLFormElement>("forma1"),
    forma2: q<HTMLFormElement>("forma2"),
    fallo1: q("fallo1"),
    fallo2: q("fallo2"),
    desenlace: q("desenlace"),
    puerta: q("puerta"),
    formaPuerta: q<HTMLFormElement>("formaPuerta"),
    palabra: q<HTMLInputElement>("palabra"),
    falloPuerta: q("falloPuerta"),
    noEncontrado: q("noEncontrado"),
  };
  return Object.values(r).every(Boolean) ? (r as Refs) : null;
}

/** ¿El trozo va en cursiva? / Is the chunk italic? */
function esCursiva(t: string): boolean {
  return t.startsWith("*") && t.endsWith("*");
}

export const Jardin = component("x-jardin", import.meta.url, {
  setup({ shadow, host, onCleanup }: SetupCtx) {
    const refs = refsDe(shadow);
    if (!refs) return;
    let estado: Estado = leerEstado();

    /** Texto en cursiva. / Italic text. */
    const nodoCursiva = (t: string): HTMLElement => {
      const em = document.createElement("em");
      em.textContent = t.slice(1, -1);
      return em;
    };

    /** Palabra casi invisible. / Nearly invisible word. */
    const nodoOculto = (t: string): HTMLElement => {
      const span = document.createElement("span");
      span.className = "oculta";
      span.tabIndex = 0;
      span.textContent = t.slice(2, -2);
      return span;
    };

    /** Enlace interno dentro del poema. / Internal link inside the poem. */
    const nodoEnlace = (t: string): HTMLElement => {
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

    /** Párrafo con cursivas, enlaces y palabras ocultas. / Paragraph with italics, links and hidden words. */
    const parrafoTexto = (texto: string): HTMLElement => {
      const p = document.createElement("p");
      const trozos = texto.split(/(\*[^*]+\*|\[\[[^\]]+\]\]|\{\{[^}]+\}\})/g);
      for (const t of trozos) {
        if (!t) continue;
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

    /** Crea un poema público. / Builds a public poem. */
    const fichaPoema = (poema: Poema): HTMLElement => {
      const li = document.createElement("li");
      li.className = "poema";
      const h = document.createElement("h2");
      h.textContent = poema.titulo;
      const p = parrafoTexto(poema.texto);
      li.append(h, p);
      if (poema.n === poemas().length) p.classList.add("cursor");
      return li;
    };

    /** Pinta los poemas públicos. / Paints the public poems. */
    const pintarPoemas = (): void => {
      refs.poemas.innerHTML = "";
      for (const poema of poemas()) refs.poemas.appendChild(fichaPoema(poema));
    };

    /** Bloque de poema descifrado. / Decrypted poem block. */
    const bloque = (titulo: string, texto: string): HTMLElement => {
      const art = document.createElement("article");
      const h = document.createElement("h2");
      h.textContent = titulo;
      const p = document.createElement("p");
      p.textContent = texto;
      art.append(h, p);
      return art;
    };

    /** Texto guardado de una mesa. / Stored text of a table. */
    const textoMesa = (id: string): string | null => {
      try {
        return sessionStorage.getItem(`gacarbla:mesa:${id}`);
      } catch {
        return null;
      }
    };

    /** Guarda el texto de una mesa. / Stores a table text. */
    const guardarTextoMesa = (id: string, texto: string): void => {
      try {
        sessionStorage.setItem(`gacarbla:mesa:${id}`, texto);
      } catch {
        /* sesión opcional / optional session */
      }
    };

    /** Sustituye la hora y el tiempo del lector en el poema 10. / Replaces the reader's time in poem 10. */
    const conEco = (texto: string): string => {
      const ahora = new Date();
      const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
      const inicio = leerEstado().inicio;
      const minutos = String(Math.max(1, Math.round((Date.now() - inicio) / 60000)));
      return texto.replace("{hora}", hora).replace("{minutos}", minutos);
    };

    /** Pinta los poemas 9 y 10 ya descifrados. / Paints decrypted poems 9 and 10. */
    const pintarDesenlace = (): void => {
      const t1 = textoMesa("mesa-1");
      const t2 = textoMesa("mesa-2");
      refs.desenlace.innerHTML = "";
      if (t1) refs.desenlace.appendChild(bloque("Novena hora", t1));
      if (t2) refs.desenlace.appendChild(bloque("La décima", conEco(t2)));
      refs.desenlace.toggleAttribute("hidden", !t1 && !t2);
    };

    /** Muestra u oculta mesas y puerta según el progreso. / Shows or hides tables and door by progress. */
    const actualizarMesas = (): void => {
      const t1 = textoMesa("mesa-1");
      const t2 = textoMesa("mesa-2");
      refs.mesa1.toggleAttribute("hidden", !!t1);
      refs.mesa2.toggleAttribute("hidden", !t1 || !!t2);
      refs.puerta.toggleAttribute("hidden", !t2);
    };

    /** Abre una mesa con las respuestas del formulario. / Opens a table with the form answers. */
    const enviarMesa = async (forma: HTMLFormElement, fallo: HTMLElement, id: string): Promise<void> => {
      const mesa = mesas().find((m) => m.id === id);
      if (!mesa) return;
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

    /** Enseña el 404 en lugar de la puerta. / Shows the 404 instead of the door. */
    const mostrar404 = (): void => {
      refs.puerta.toggleAttribute("hidden", true);
      refs.noEncontrado.toggleAttribute("hidden", false);
    };

    /** La palabra del poema 10 abre la fase 2 o devuelve un 404. / Word from poem 10 opens phase 2 or returns a 404. */
    const enviarPuerta = async (e: Event): Promise<void> => {
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

    const onForma1 = (e: Event): void => {
      e.preventDefault();
      void enviarMesa(refs.forma1, refs.fallo1, "mesa-1");
    };
    const onForma2 = (e: Event): void => {
      e.preventDefault();
      void enviarMesa(refs.forma2, refs.fallo2, "mesa-2");
    };
    const onPuerta = (e: Event): void => {
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
