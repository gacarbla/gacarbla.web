import { component, type SetupCtx } from "../../lib/rtw/index.js";
import {
  abrirMesa,
  abierta,
  completo,
  leerEstado,
  lineaFinal,
  mesas,
  poemas,
  seccion,
  type Estado,
} from "../../lib/archivo.js";

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
}

/**
 * Recoge las refs. / Collects the refs.
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
  };
  return Object.values(r).every(Boolean) ? (r as Refs) : null;
}

/**
 * El Archivo: los poemas que el sitio no firmó. Se entra por el menú
 * contextual de "Inicio" y todo lo demás se descubre dentro, sin menús
 * ni contadores. Poemas 1–8 públicos; 9 y 10 cifrados.
 * The Archive: the poems the site never signed. Entered through the
 * "Inicio" context menu and everything else is discovered inside, with
 * no menus or counters. Poems 1–8 public; 9 and 10 encrypted.
 *
 * Uso / Usage: <x-jardin></x-jardin> en /jardin.
 */
export const Jardin = component("x-jardin", import.meta.url, {
  setup({ shadow, onCleanup }: SetupCtx) {
    const refs = refsDe(shadow);
    if (!refs) return;
    let estado: Estado = leerEstado();
    /** Buffer del marco secreto. / Secret-frame buffer. */
    let buffer = "";

    /** Texto con cursivas marcadas con asteriscos. / Text with asterisk-marked italics. */
    const parrafoTexto = (texto: string): HTMLElement => {
      const p = document.createElement("p");
      const trozos = texto.split(/(\*[^*]+\*)/g);
      for (const t of trozos) {
        if (!t) continue;
        if (t.startsWith("*") && t.endsWith("*") && t.length > 2) {
          const em = document.createElement("em");
          em.textContent = t.slice(1, -1);
          p.appendChild(em);
        } else {
          p.appendChild(document.createTextNode(t));
        }
      }
      return p;
    };

    /** Crea un poema público. / Builds a public poem. */
    const fichaPoema = (n: number, titulo: string, texto: string, secreto?: string): HTMLElement => {
      const li = document.createElement("li");
      li.className = "poema";
      const h = document.createElement("h2");
      h.textContent = titulo;
      const p = parrafoTexto(texto);
      li.append(h, p);
      if (secreto) li.appendChild(enlaceSecreto(secreto));
      if (n === poemas().length) p.classList.add("cursor");
      return li;
    };

    /** Enlace casi invisible a una sección. / Nearly invisible section link. */
    const enlaceSecreto = (id: string): HTMLElement => {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.className = "invisible";
      a.href = `#${id}`;
      a.textContent = "·";
      a.setAttribute("aria-label", "sigue");
      p.appendChild(a);
      return p;
    };

    /** Pinta los poemas públicos. / Paints the public poems. */
    const pintarPoemas = (): void => {
      refs.poemas.innerHTML = "";
      for (const p of poemas()) {
        refs.poemas.appendChild(fichaPoema(p.n, p.titulo, p.texto, p.secreto));
      }
    };

    /**
     * Pinta el desenlace: poema 9 y, si toca, 10 y la firma.
     * Paints the outcome: poem 9 and, when due, 10 and the signature.
     */
    const pintarDesenlace = async (): Promise<void> => {
      const partes = await bloquesAbiertos();
      refs.desenlace.innerHTML = "";
      refs.desenlace.toggleAttribute("hidden", partes.length === 0);
      for (const p of partes) refs.desenlace.appendChild(p);
      if (completo(estado)) refs.desenlace.appendChild(firma());
    };

    /**
     * Bloques de las mesas ya abiertas. / Blocks of already opened tables.
     */
    const bloquesAbiertos = async (): Promise<HTMLElement[]> => {
      const partes: HTMLElement[] = [];
      for (const m of mesas()) {
        if (!abierta(estado, m.id)) continue;
        const texto = await reabrir(m.id);
        if (!texto) continue;
        const titulo = m.id === "mesa-1" ? "Novena hora" : "La décima";
        partes.push(bloque(titulo, m.id === "mesa-2" ? conEco(texto) : texto));
      }
      return partes;
    };

    /**
     * Sustituye la hora y el tiempo del lector en el poema 10.
     * Replaces the reader's time and elapsed minutes in poem 10.
     */
    const conEco = (texto: string): string => {
      const ahora = new Date();
      const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
      const minutos = String(Math.max(1, Math.round((Date.now() - estado.inicio) / 60000)));
      return texto.replace("{hora}", hora).replace("{minutos}", minutos);
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

    /** Firma final del archivo. / Archive final signature. */
    const firma = (): HTMLElement => {
      const p = document.createElement("p");
      p.className = "firma";
      p.textContent = lineaFinal();
      return p;
    };

    /**
     * Recupera el texto de una mesa ya abierta releyendo el hash guardado.
     * Re-reads the text of an already opened table from the stored hash.
     */
    const reabrir = async (id: string): Promise<string | null> => {
      const guardado = sessionStorage.getItem(`gacarbla:mesa:${id}`);
      if (!guardado) return null;
      return guardado;
    };

    /** Pinta una sección secreta en el flujo de poemas. / Paints a secret section in the flow. */
    const pintarSeccion = (id: string): void => {
      const s = seccion(id);
      if (!s) return;
      const li = document.createElement("li");
      li.className = "poema";
      const h = document.createElement("h2");
      h.textContent = s.titulo;
      const p = document.createElement("p");
      p.textContent = s.texto;
      li.append(h, p);
      refs.poemas.appendChild(li);
    };

    /** Muestra la mesa de la cinta si el archivo llega ahí. / Shows the tape table when the archive gets there. */
    const mirarFragmento = (): void => {
      const id = location.hash.replace("#", "");
      if (!id) return;
      if (id === "diez") {
        if (abierta(estado, "mesa-1")) refs.mesa2.toggleAttribute("hidden", false);
        return;
      }
      pintarSeccion(id);
    };

    /** Abre una mesa con las respuestas del formulario. / Opens a table with the form answers. */
    const enviar = async (forma: HTMLFormElement, fallo: HTMLElement, id: string): Promise<void> => {
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
      try {
        sessionStorage.setItem(`gacarbla:mesa:${id}`, texto);
      } catch {
        /* sesión opcional / optional session */
      }
      forma.closest(".mesa")?.setAttribute("hidden", "");
      await pintarDesenlace();
    };

    /** ¿El foco está en un campo? / Is focus inside a field? */
    const enCampo = (e: KeyboardEvent): boolean => {
      const t = e.target as HTMLElement | null;
      if (!t) return false;
      return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT";
    };

    /** ¿La tecla alimenta el buffer secreto? / Does the key feed the secret buffer? */
    const esLetra = (e: KeyboardEvent): boolean => {
      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return false;
      return !enCampo(e) && /^[a-zA-Z]$/.test(e.key);
    };

    /** Marco secreto: teclear "archivo". / Secret frame: typing "archivo". */
    const alTeclado = (e: KeyboardEvent): void => {
      if (!esLetra(e)) {
        buffer = "";
        return;
      }
      buffer = (buffer + e.key.toLowerCase()).slice(-7);
      if (buffer === "archivo") {
        buffer = "";
        refs.mesa1.toggleAttribute("hidden", false);
      }
    };

    const onForma1 = (e: Event): void => {
      e.preventDefault();
      void enviar(refs.forma1, refs.fallo1, "mesa-1");
    };
    const onForma2 = (e: Event): void => {
      e.preventDefault();
      void enviar(refs.forma2, refs.fallo2, "mesa-2");
    };

    refs.forma1.addEventListener("submit", onForma1);
    refs.forma2.addEventListener("submit", onForma2);
    window.addEventListener("keydown", alTeclado);
    window.addEventListener("hashchange", mirarFragmento);
    onCleanup(() => {
      refs.forma1.removeEventListener("submit", onForma1);
      refs.forma2.removeEventListener("submit", onForma2);
      window.removeEventListener("keydown", alTeclado);
      window.removeEventListener("hashchange", mirarFragmento);
    });

    pintarPoemas();
    mirarFragmento();
    if (abierta(estado, "mesa-1")) refs.mesa1.toggleAttribute("hidden", true);
    if (completo(estado)) refs.mesa2.toggleAttribute("hidden", true);
    void pintarDesenlace();
  },
});
