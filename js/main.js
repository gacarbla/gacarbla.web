/**
 * GACARBLA — interacción del atlas.
 * Sincroniza el índice de mundos con la constelación, mueve el reloj
 * y añade un parallax mínimo. Todo es opcional: sin JS la página se lee igual.
 */

const worlds = [...document.querySelectorAll(".worlds .world")];
const nodes = [...document.querySelectorAll(".node[data-node]")];
const edges = [...document.querySelectorAll(".edge[data-edge]")];
const caption = document.getElementById("atlas-caption");
const captionTitle = caption ? caption.querySelector("strong") : null;
const captionMeta = caption ? caption.querySelector("span") : null;

/** Estado de reposo de la leyenda del mapa. */
const REPOSO = { titulo: "Constelación", meta: "06 mundos · 01 en línea" };

let activo = null;

/**
 * Marca un mundo como activo (o ninguno con null).
 * @param {string | null} id - Identificador del mundo.
 */
function activar(id) {
  if (id === activo) return;
  activo = id;

  for (const elemento of worlds) {
    elemento.classList.toggle("is-active", elemento.dataset.world === id);
  }
  for (const elemento of nodes) {
    elemento.classList.toggle("is-active", elemento.dataset.node === id);
  }
  for (const elemento of edges) {
    elemento.classList.toggle("is-active", elemento.dataset.edge === id);
  }

  if (!captionTitle || !captionMeta) return;
  const mundo = id ? worlds.find((elemento) => elemento.dataset.world === id) : null;
  captionTitle.textContent = mundo ? mundo.dataset.title : REPOSO.titulo;
  captionMeta.textContent = mundo ? mundo.dataset.meta : REPOSO.meta;
}

for (const mundo of worlds) {
  const id = mundo.dataset.world;
  mundo.addEventListener("pointerenter", () => activar(id));
  mundo.addEventListener("pointerdown", () => activar(id));
  mundo.addEventListener("focusin", () => activar(id));
  mundo.addEventListener("focusout", (evento) => {
    if (!mundo.contains(evento.relatedTarget)) activar(null);
  });
}

const lista = document.querySelector(".worlds");
if (lista) {
  lista.addEventListener("pointerleave", () => activar(null));
}

/* Parallax muy leve del mapa, solo con ratón y sin movimiento reducido. */
const svg = document.querySelector(".atlas-svg");
const panel = document.querySelector(".atlas-panel");
const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
const punteroFino = window.matchMedia("(hover: hover) and (pointer: fine)");

if (svg && panel && punteroFino.matches && !menosMovimiento.matches) {
  panel.addEventListener("pointermove", (evento) => {
    const caja = panel.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width - 0.5;
    const y = (evento.clientY - caja.top) / caja.height - 0.5;
    svg.style.transform = `translate3d(${(x * 9).toFixed(2)}px, ${(y * 9).toFixed(2)}px, 0)`;
  });
  panel.addEventListener("pointerleave", () => {
    svg.style.transform = "";
  });
}

/* Reloj de Madrid, por si el visitante está en otra parte. */
const reloj = document.getElementById("reloj");
if (reloj) {
  const formato = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Madrid",
  });
  const tic = () => {
    const ahora = new Date();
    try {
      reloj.textContent = formato.format(ahora);
    } catch {
      reloj.textContent = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    }
    reloj.setAttribute("datetime", ahora.toISOString());
  };
  tic();
  window.setInterval(tic, 20_000);
}

for (const anio of document.querySelectorAll("[data-year]")) {
  anio.textContent = String(new Date().getFullYear());
}

console.log(
  "%cGACARBLA%c\nUn autor, muchos mundos.\nSi estás mirando la consola, probablemente también construyes cosas.\nEscríbeme: gacarbla@gacarbla.es",
  "font: 600 15px ui-monospace, monospace; color: #bd4a12; letter-spacing: .2em",
  "font: 12px ui-monospace, monospace; color: #7c7363; line-height: 1.7",
);
