/**
 * GACARBLA — recorrido por el cielo.
 *
 * El scroll decide qué mundo está en el centro de la pantalla; la
 * constelación se desplaza hasta él como un objetivo y deja el resto
 * en penumbra. Sin cursor, sin dependencias y sin bloquear el scroll.
 */

const svg = document.querySelector(".lens-svg");
const cielo = svg ? svg.querySelector(".sky") : null;
const capitulos = [...document.querySelectorAll(".chapter")];
const aristas = [...document.querySelectorAll(".edge[data-edge]")];
const marcas = [...document.querySelectorAll(".lens-ticks line[data-tick]")];

const nodos = new Map();
for (const nodo of document.querySelectorAll(".node[data-node]")) {
  nodos.set(nodo.dataset.node, {
    x: Number(nodo.dataset.x),
    y: Number(nodo.dataset.y),
    el: nodo,
  });
}

const CENTRO = 300;
const ENFOQUE = 0.7;
const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activo = null;
let objetivo = { x: CENTRO, y: CENTRO, zoom: 1.1 };
let actual = { ...objetivo };
let frame = 0;

/**
 * Escribe la cámara en el grupo del cielo.
 * (300, 300) es el centro de la lente en unidades del viewBox.
 */
function aplicar() {
  if (!cielo) return;
  cielo.setAttribute(
    "transform",
    `translate(${CENTRO} ${CENTRO}) scale(${actual.zoom.toFixed(4)}) translate(${(-actual.x).toFixed(2)} ${(-actual.y).toFixed(2)})`,
  );
}

/** Acerca la cámara al objetivo con una easing corta. */
function animar() {
  const k = 0.12;
  actual.x += (objetivo.x - actual.x) * k;
  actual.y += (objetivo.y - actual.y) * k;
  actual.zoom += (objetivo.zoom - actual.zoom) * k;
  aplicar();

  const cerca =
    Math.abs(objetivo.x - actual.x) < 0.15 &&
    Math.abs(objetivo.y - actual.y) < 0.15 &&
    Math.abs(objetivo.zoom - actual.zoom) < 0.0005;

  if (cerca) {
    actual = { ...objetivo };
    aplicar();
    frame = 0;
    return;
  }
  frame = requestAnimationFrame(animar);
}

function arrancar() {
  if (reducido) {
    actual = { ...objetivo };
    aplicar();
    return;
  }
  if (!frame) frame = requestAnimationFrame(animar);
}

/**
 * Activa un mundo: capítulo, nodo, arista y marca de la lente.
 * @param {string | null} id - Identificador del mundo, o null para el conjunto.
 */
function activar(id) {
  if (id === activo) return;
  activo = id;

  for (const capitulo of capitulos) {
    capitulo.classList.toggle("is-current", capitulo.dataset.world === id);
  }
  for (const [clave, nodo] of nodos) {
    nodo.el.classList.toggle("is-active", clave === id);
  }
  for (const arista of aristas) {
    arista.classList.toggle("is-active", arista.dataset.edge === id);
  }
  for (const marca of marcas) {
    marca.classList.toggle("is-active", marca.dataset.tick === id);
  }
  if (svg) svg.toggleAttribute("data-active", Boolean(id));

  const nodo = id ? nodos.get(id) : null;
  objetivo = nodo
    ? {
        x: CENTRO + (nodo.x - CENTRO) * ENFOQUE,
        y: CENTRO + (nodo.y - CENTRO) * ENFOQUE,
        zoom: 1.18,
      }
    : { x: CENTRO, y: CENTRO, zoom: 1.1 };
  arrancar();
}

/** Elige el capítulo más cercano al centro de la ventana. */
function medir() {
  if (capitulos.length === 0) return;

  const medio = window.innerHeight / 2;
  let mejor = null;
  let distancia = Infinity;

  for (const capitulo of capitulos) {
    const caja = capitulo.getBoundingClientRect();
    const d = Math.abs(caja.top + caja.height / 2 - medio);
    if (d < distancia) {
      distancia = d;
      mejor = capitulo;
    }
  }

  const limite = window.innerHeight * 0.45;
  activar(mejor && distancia < limite ? mejor.dataset.world : null);
}

let pendiente = false;
function alDesplazar() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => {
    medir();
    pendiente = false;
  });
}

if (capitulos.length > 0) {
  aplicar();
  medir();
  window.addEventListener("scroll", alDesplazar, { passive: true });
  window.addEventListener("resize", alDesplazar);
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
