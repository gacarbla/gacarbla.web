import { component } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { generarMuros, colocarPunto, hayMuro, LADO } from "./muros.js";
const META = 5;
const CUENTA = 10;
const COLORES = ["#e05252", "#4d8fd1", "#3fa34d", "#d9a419"];
const COLOR_KEYS = ["lab.rojo", "lab.azul", "lab.verde", "lab.amarillo"];
const ESQUINAS = [
    { x: 0, y: 0 },
    { x: LADO - 1, y: 0 },
    { x: 0, y: LADO - 1 },
    { x: LADO - 1, y: LADO - 1 },
];
const FLECHAS = ["↖", "↗", "↙", "↘"];
const ESQ_KEYS = ["lab.esq_no", "lab.esq_ne", "lab.esq_so", "lab.esq_se"];
const CARAS_CUBO = [
    { v: 1, rx: 0, ry: 0 },
    { v: 2, rx: 0, ry: -90 },
    { v: 3, rx: 0, ry: 90 },
    { v: 4, rx: 0, ry: 180 },
    { v: 2, rx: -90, ry: 0 },
    { v: 3, rx: 90, ry: 0 },
];
const COLOCAR_CUBO = [
    "rotateY(0deg)",
    "rotateY(90deg)",
    "rotateY(-90deg)",
    "rotateY(180deg)",
    "rotateX(90deg)",
    "rotateX(-90deg)",
];
const PIPS = { 1: [5], 2: [3, 7], 3: [1, 5, 9], 4: [1, 3, 7, 9] };
function claveArista(ax, ay, bx, by) {
    return ax < bx || (ax === bx && ay < by) ? `${ax},${ay}|${bx},${by}` : `${bx},${by}|${ax},${ay}`;
}
const TECLAS = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    w: [0, -1],
    W: [0, -1],
    s: [0, 1],
    S: [0, 1],
    a: [-1, 0],
    A: [-1, 0],
    d: [1, 0],
    D: [1, 0],
};
function esEditable(t) {
    if (t === null)
        return false;
    const tag = t.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
function esTirar(key) {
    return key === " " || key === "Enter";
}
function accionTecla(key, fase, esBoton) {
    const paso = TECLAS[key];
    if (paso && fase === "pasos")
        return { kind: "paso", dx: paso[0], dy: paso[1] };
    if (esTirar(key) && fase === "tirar" && !esBoton)
        return { kind: "tirar" };
    return { kind: "nada" };
}
function fueraDe(nx, ny) {
    return nx < 0 || ny < 0 || nx >= LADO || ny >= LADO;
}
function validarPaso(jx, jy, dx, dy, muros, punto) {
    const nx = jx + dx;
    const ny = jy + dy;
    if (fueraDe(nx, ny))
        return { kind: "fuera" };
    if (hayMuro(muros, jx, jy, nx, ny))
        return { kind: "choque", ax: jx, ay: jy, bx: nx, by: ny };
    if (punto !== null && punto.x === nx && punto.y === ny)
        return { kind: "captura", nx, ny };
    return { kind: "ok", nx, ny };
}
function baseDe(fase, slots, jugs) {
    const bases = new Map();
    if (fase === "conf") {
        for (const s of slots) {
            if (s.esq === null)
                continue;
            const e = ESQUINAS[s.esq];
            bases.set(`${e.x},${e.y}`, s.color);
        }
        return bases;
    }
    for (const j of jugs)
        bases.set(`${j.ox},${j.oy}`, j.color);
    return bases;
}
function libresConf(fase, pendiente, slots) {
    const libres = new Set();
    if (fase !== "conf" || pendiente === null)
        return libres;
    for (let i = 0; i < ESQUINAS.length; i++) {
        if (slots.some((o) => o !== pendiente && o.esq === i))
            continue;
        const e = ESQUINAS[i];
        libres.add(`${e.x},${e.y}`);
    }
    return libres;
}
function clasesMuro(x, y, muros) {
    return {
        me: x + 1 < LADO && hayMuro(muros, x, y, x + 1, y),
        ms: y + 1 < LADO && hayMuro(muros, x, y, x, y + 1),
    };
}
function clasePintura(x, y, pinturas) {
    const colE = x + 1 < LADO ? pinturas.get(claveArista(x, y, x + 1, y)) : undefined;
    const colS = y + 1 < LADO ? pinturas.get(claveArista(x, y, x, y + 1)) : undefined;
    return { e: colE !== undefined, s: colS !== undefined, color: colE ?? colS };
}
function esPunto(x, y, punto) {
    return punto !== null && punto.x === x && punto.y === y;
}
function pintarCelda(c, ctx) {
    const muro = clasesMuro(ctx.x, ctx.y, ctx.muros);
    c.classList.toggle("me", muro.me);
    c.classList.toggle("ms", muro.ms);
    const gol = clasePintura(ctx.x, ctx.y, ctx.pinturas);
    c.classList.toggle("golpe-e", gol.e);
    c.classList.toggle("golpe-s", gol.s);
    if (gol.color !== undefined)
        c.style.setProperty("--wc", COLORES[gol.color]);
    else
        c.style.removeProperty("--wc");
    c.classList.toggle("libre", ctx.libres.has(`${ctx.x},${ctx.y}`));
    const base = ctx.bases.get(`${ctx.x},${ctx.y}`);
    if (base !== undefined) {
        c.classList.add("base");
        c.style.setProperty("--base", COLORES[base]);
    }
    else {
        c.classList.remove("base");
        c.style.removeProperty("--base");
    }
    c.innerHTML = "";
    if (esPunto(ctx.x, ctx.y, ctx.punto)) {
        const dentro = document.createElement("span");
        dentro.className = "dentro";
        const p = document.createElement("span");
        p.className = "punto-cel";
        dentro.appendChild(p);
        c.appendChild(dentro);
    }
}
function elegirCara() {
    const cara = CARAS_CUBO[Math.floor(Math.random() * CARAS_CUBO.length)];
    return { v: cara.v, rx: cara.rx, ry: cara.ry };
}
function giroDestino(cur, dest) {
    return cur + 720 + ((((dest - cur) % 360) + 360) % 360);
}
function trayectoriaLanzar(aterriza, reposo, bw, bh) {
    const aj = aterriza ? [0.18, 5, 85] : [0.08, 10, 80];
    const m = aj[0];
    const zmin = aj[1];
    const zmax = aj[2];
    const dx = (Math.random() * 2 - 1) * m * bw;
    const dy = (Math.random() * 2 - 1) * m * bh;
    const rz = (zmin + Math.random() * (zmax - zmin)) * (Math.random() < 0.5 ? -1 : 1);
    const fin = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rz.toFixed(1)}deg)`;
    if (aterriza && reposo !== null) {
        const mid = `translate(${(dx * 0.25).toFixed(1)}px, ${(dy * 0.25 - Math.max(bw, bh) * 0.04).toFixed(1)}px)` +
            ` rotate(${(rz * 0.4).toFixed(1)}deg)`;
        return { fin, frames: [{ transform: reposo }, { transform: mid, offset: 0.35 }, { transform: fin }], dur: 900 };
    }
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.max(bw, bh) * 0.75;
    const iz = rz + (360 + Math.random() * 360) * (Math.random() < 0.5 ? -1 : 1);
    const ini = `translate(${(Math.cos(ang) * dist).toFixed(1)}px, ${(Math.sin(ang) * dist).toFixed(1)}px)` +
        ` rotate(${iz.toFixed(1)}deg)`;
    return { fin, frames: [{ transform: ini }, { transform: fin }], dur: 650 };
}
function resolverCaptura(pasos, solo) {
    if (solo)
        return "quedar";
    if (pasos > 0)
        return "elegir";
    return "tirar";
}
function recogerRefs(shadow) {
    const q = (n) => shadow.querySelector(`[data-ref="${n}"]`);
    const r = {
        relojEl: q("reloj"),
        disponibles: q("disponibles"),
        puestos: q("puestos"),
        empezarBtn: q("empezar"),
        ladoSetup: q("ladoSetup"),
        ladoPuntos: q("ladoPuntos"),
        marcador: q("marcador"),
        tablero: q("tablero"),
        previa: q("previa"),
        cuentaEl: q("cuenta"),
        saltarBtn: q("saltar"),
        cajaEl: q("caja"),
        mensajeEl: q("mensaje"),
        pad: q("pad"),
        seguirBtn: q("seguir"),
        seguirN: q("seguirN"),
        pasarBtn: q("pasar"),
        finalEl: q("final"),
        ganadorPunto: q("ganadorPunto"),
        revanchaBtn: q("revancha"),
        nuevaBtn: q("nueva"),
        dado3dEl: q("dado3d"),
        cuboEl: q("cubo"),
        quedanEl: q("quedan"),
        quedanN: q("quedanN"),
        pistaDado: q("pistaDado"),
        tiroEl: q("tiro"),
        lanzarEl: q("lanzar"),
    };
    for (const el of Object.values(r)) {
        if (el === null)
            return null;
    }
    return r;
}
export const Laberinto = component("x-laberinto", import.meta.url, {
    setup({ shadow, onCleanup }) {
        const refs = recogerRefs(shadow);
        if (refs === null)
            return;
        const { relojEl, disponibles, puestos, empezarBtn, ladoSetup, ladoPuntos, marcador, tablero, previa, cuentaEl, saltarBtn, cajaEl, mensajeEl, pad, seguirBtn, seguirN, pasarBtn, finalEl, ganadorPunto, revanchaBtn, nuevaBtn, dado3dEl, cuboEl, quedanEl, quedanN, pistaDado, tiroEl, lanzarEl, } = refs;
        const stopI18n = i18n.apply(shadow);
        let slots = [];
        let pendiente = null;
        let jugs = [];
        let muros = new Set();
        let punto = null;
        let fase = "conf";
        let turno = 0;
        let pasos = 0;
        let dado = null;
        let cuenta = CUENTA;
        let segundos = 0;
        let ticker = null;
        let celdas = [];
        let capa = null;
        const fichas = new Map();
        let sinAnim = false;
        let pinturas = new Map();
        let ultimoGolpe = new Map();
        let muriendo = false;
        let muertoIdx = null;
        let naciendoIdx = null;
        let cazaIdx = null;
        let tMuerte = null;
        let tNace = null;
        let tCaza = null;
        let vela = null;
        let tRes = null;
        let tSale = null;
        const giro = { x: 0, y: 0 };
        let animDado = null;
        let animLanzar = null;
        let reposo = null;
        let vivo = true;
        const esSolo = () => jugs.length === 1;
        const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
        const armarTablero = () => {
            tablero.innerHTML = "";
            celdas = [];
            fichas.clear();
            for (let y = 0; y < LADO; y++) {
                for (let x = 0; x < LADO; x++) {
                    const c = document.createElement("div");
                    c.className = "cel";
                    if (ESQUINAS.some((e) => e.x === x && e.y === y))
                        c.classList.add("esq");
                    tablero.appendChild(c);
                    celdas.push(c);
                }
            }
            capa = document.createElement("div");
            capa.className = "capa";
            tablero.appendChild(capa);
        };
        const armarDado = () => {
            cuboEl.innerHTML = "";
            CARAS_CUBO.forEach((cara, i) => {
                const f = document.createElement("div");
                f.className = "cara";
                f.style.transform = `${COLOCAR_CUBO[i]} translateZ(36px)`;
                for (const p of PIPS[cara.v] ?? []) {
                    const s = document.createElement("span");
                    s.className = "pipo";
                    s.style.gridRow = String(Math.ceil(p / 3));
                    s.style.gridColumn = String(((p - 1) % 3) + 1);
                    f.appendChild(s);
                }
                cuboEl.appendChild(f);
            });
        };
        const avisar = (key) => {
            if (key)
                mensajeEl.setAttribute("data-i18n", key);
            else
                mensajeEl.removeAttribute("data-i18n");
            mensajeEl.textContent = "";
            i18n.paint(shadow);
        };
        const posiciones = () => jugs.map((j) => ({ x: j.x, y: j.y }));
        const origenes = () => jugs.map((j) => ({ x: j.ox, y: j.oy }));
        const pintarVisibilidad = () => {
            ladoSetup.toggleAttribute("hidden", fase !== "conf");
            ladoPuntos.toggleAttribute("hidden", fase === "conf");
            previa.toggleAttribute("hidden", fase !== "mirando");
            finalEl.toggleAttribute("hidden", fase !== "fin");
            tablero.toggleAttribute("data-mirando", fase === "mirando");
            tablero.toggleAttribute("data-elige", fase === "conf" && pendiente !== null);
            tablero.toggleAttribute("data-golpe", pinturas.size > 0);
            relojEl.textContent = fmt(segundos);
            if (fase === "mirando")
                cuentaEl.textContent = String(cuenta);
        };
        const pintarMarcador = () => {
            marcador.innerHTML = "";
            jugs.forEach((j, i) => {
                const f = document.createElement("span");
                f.className = "ficha";
                if (i === turno && fase !== "fin" && fase !== "mirando")
                    f.setAttribute("data-actual", "");
                const d = document.createElement("span");
                d.className = "punto";
                d.style.background = COLORES[j.color];
                const t = document.createElement("strong");
                t.textContent = `×${j.puntos}`;
                f.append(d, t);
                marcador.appendChild(f);
            });
        };
        const hayTiro = () => {
            if (esSolo())
                return undefined;
            if (fase !== "tirar" && fase !== "elegir")
                return undefined;
            return jugs[turno];
        };
        const pintarVela = () => {
            const jt = hayTiro();
            dado3dEl.style.setProperty("--dado", jt !== undefined ? COLORES[jt.color] : "var(--accent)");
            tiroEl.toggleAttribute("hidden", vela === null);
            tiroEl.toggleAttribute("data-on", vela !== null && vela !== "saliendo");
            if (vela === "tiro")
                dado3dEl.removeAttribute("disabled");
            else
                dado3dEl.setAttribute("disabled", "");
            dado3dEl.toggleAttribute("data-listo", vela === "tiro");
            pistaDado.toggleAttribute("hidden", vela !== "tiro");
        };
        const pintarPadColor = () => {
            const enJuego = (fase === "tirar" || fase === "pasos" || fase === "elegir") && jugs[turno];
            pad.style.setProperty("--turno", enJuego ? COLORES[jugs[turno]?.color ?? 0] : "var(--accent)");
        };
        const pintarPadBotones = () => {
            const enPasos = fase === "pasos" && !muriendo && (esSolo() || pasos > 0);
            for (const b of pad.querySelectorAll("button")) {
                if (enPasos)
                    b.removeAttribute("disabled");
                else
                    b.setAttribute("disabled", "");
            }
        };
        const pintarSeguir = () => {
            seguirBtn.toggleAttribute("hidden", fase !== "elegir");
            if (fase === "elegir") {
                seguirN.textContent = String(pasos);
                if (vela !== "tiro")
                    seguirBtn.setAttribute("disabled", "");
                else
                    seguirBtn.removeAttribute("disabled");
            }
        };
        const pintarPasar = () => {
            pasarBtn.toggleAttribute("hidden", !(fase === "pasos" && !esSolo() && pasos <= 0));
        };
        const pintarQuedan = () => {
            quedanEl.toggleAttribute("data-vacio", esSolo() || fase !== "pasos" || pasos <= 0);
            if (!esSolo() && fase === "pasos")
                quedanN.textContent = String(pasos);
        };
        const pintarGanador = () => {
            if (fase === "fin" && jugs[turno]) {
                ganadorPunto.style.background = COLORES[jugs[turno]?.color ?? 0];
            }
        };
        const pintarControles = () => {
            pintarPadColor();
            pintarVela();
            pintarPadBotones();
            pintarSeguir();
            pintarPasar();
            pintarQuedan();
            pintarGanador();
        };
        const pintar = () => {
            pintarVisibilidad();
            pintarMarcador();
            pintarControles();
            pintarLado();
            pintarTablero();
            pintarFichas();
        };
        const pintarTablero = () => {
            const bases = baseDe(fase, slots, jugs);
            const libres = libresConf(fase, pendiente, slots);
            for (let y = 0; y < LADO; y++) {
                for (let x = 0; x < LADO; x++) {
                    pintarCelda(celdas[y * LADO + x], {
                        x,
                        y,
                        muros,
                        pinturas,
                        bases,
                        libres,
                        punto,
                    });
                }
            }
        };
        const obtenerFicha = (i) => {
            let el = fichas.get(i);
            if (!el) {
                el = document.createElement("span");
                el.className = "ficha-movil";
                capa?.appendChild(el);
                fichas.set(i, el);
            }
            return el;
        };
        const marcarFicha = (el, i) => {
            el.toggleAttribute("data-actual", i === turno && fase !== "fin" && fase !== "conf" && fase !== "mirando");
            el.toggleAttribute("data-muriendo", muriendo && i === muertoIdx);
            el.toggleAttribute("data-naciendo", i === naciendoIdx);
            el.toggleAttribute("data-caza", i === cazaIdx);
        };
        const colocarFicha = (el, j, i, junto) => {
            const c = celdas[j.y * LADO + j.x];
            const t = Math.max(10, Math.min(c.offsetWidth, c.offsetHeight) * 0.58);
            const dx = (junto.indexOf(i) - (junto.length - 1) / 2) * t * 0.8;
            if (sinAnim)
                el.classList.add("sin");
            el.style.width = `${t}px`;
            el.style.height = `${t}px`;
            el.style.transform = `translate(${c.offsetLeft + (c.offsetWidth - t) / 2 + dx}px, ${c.offsetTop + (c.offsetHeight - t) / 2}px)`;
            el.style.background = COLORES[j.color];
            marcarFicha(el, i);
            if (sinAnim) {
                void el.offsetWidth;
                el.classList.remove("sin");
            }
        };
        const pintarFichas = () => {
            if (!capa)
                return;
            for (const [i, el] of [...fichas]) {
                if (!jugs[i]) {
                    el.remove();
                    fichas.delete(i);
                }
            }
            const grupos = new Map();
            jugs.forEach((j, i) => {
                const k = `${j.x},${j.y}`;
                if (!grupos.has(k))
                    grupos.set(k, []);
                grupos.get(k).push(i);
            });
            jugs.forEach((j, i) => {
                colocarFicha(obtenerFicha(i), j, i, grupos.get(`${j.x},${j.y}`));
            });
            sinAnim = false;
        };
        const pintarLado = () => {
            if (fase !== "conf")
                return;
            disponibles.innerHTML = "";
            COLORES.forEach((hex, ci) => {
                if (slots.some((s) => s.color === ci))
                    return;
                const b = document.createElement("button");
                b.type = "button";
                b.className = "disp";
                b.style.background = hex;
                b.setAttribute("data-i18n-aria-label", COLOR_KEYS[ci]);
                const mas = document.createElement("span");
                mas.className = "mas";
                mas.textContent = "+";
                b.appendChild(mas);
                b.addEventListener("click", () => elegirColor(ci));
                disponibles.appendChild(b);
            });
            puestos.innerHTML = "";
            slots.forEach((s) => {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "puesto";
                if (s === pendiente)
                    b.setAttribute("data-pend", "");
                const d = document.createElement("span");
                d.className = "punto";
                d.style.background = COLORES[s.color];
                b.appendChild(d);
                const e = document.createElement("span");
                e.className = "donde";
                e.textContent = s.esq === null ? "…" : FLECHAS[s.esq];
                b.appendChild(e);
                b.addEventListener("click", () => quitarSlot(s));
                puestos.appendChild(b);
            });
            const listo = slots.length > 0 && slots.every((s) => s.esq !== null);
            if (listo)
                empezarBtn.removeAttribute("disabled");
            else
                empezarBtn.setAttribute("disabled", "");
            i18n.paint(shadow);
        };
        const elegirColor = (ci) => {
            if (fase !== "conf")
                return;
            if (pendiente !== null)
                slots = slots.filter((s) => s !== pendiente);
            const s = { color: ci, esq: null };
            slots.push(s);
            pendiente = s;
            avisar("lab.elige_esquina");
            pintar();
        };
        const quitarSlot = (s) => {
            if (fase !== "conf")
                return;
            slots = slots.filter((o) => o !== s);
            if (pendiente === s)
                pendiente = null;
            avisar(null);
            pintar();
        };
        const pararReloj = () => {
            if (ticker !== null) {
                clearInterval(ticker);
                ticker = null;
            }
        };
        const pararTiros = () => {
            if (tRes !== null)
                clearTimeout(tRes);
            if (tSale !== null)
                clearTimeout(tSale);
            tRes = tSale = null;
            animLanzar?.cancel();
            animLanzar = null;
            lanzarEl.style.transform = "";
            reposo = null;
            vela = null;
        };
        const iniciarPartida = () => {
            muros = generarMuros();
            pinturas = new Map();
            ultimoGolpe = new Map();
            pararAnims();
            pararTiros();
            sinAnim = true;
            animDado?.cancel();
            animDado = null;
            vela = null;
            jugs = slots
                .filter((s) => s.esq !== null)
                .map((s) => {
                const o = ESQUINAS[s.esq];
                return { color: s.color, x: o.x, y: o.y, ox: o.x, oy: o.y, puntos: 0 };
            });
            if (jugs.length === 0)
                return;
            punto = null;
            turno = 0;
            pasos = 0;
            dado = null;
            cuenta = CUENTA;
            segundos = 0;
            pendiente = null;
            irA("mirando");
            avisar(null);
            pararReloj();
            ticker = setInterval(() => {
                segundos++;
                relojEl.textContent = fmt(segundos);
                if (fase === "mirando") {
                    cuenta--;
                    if (cuenta <= 0)
                        terminarPrevia();
                    else
                        cuentaEl.textContent = String(cuenta);
                }
            }, 1000);
            pintar();
            tablero.classList.add("sin");
            void tablero.offsetWidth;
            tablero.classList.remove("sin");
        };
        const terminarPrevia = () => {
            if (fase !== "mirando")
                return;
            punto = colocarPunto(posiciones(), origenes());
            if (esSolo()) {
                pasos = 1;
                irA("pasos");
            }
            else {
                mostrarTiro("tirar");
            }
            pintar();
        };
        const siguienteTurno = () => {
            turno = (turno + 1) % Math.max(1, jugs.length);
            pasos = 0;
            dado = null;
            mostrarTiro("tirar");
            avisar(null);
            pintar();
        };
        const irA = (f) => {
            fase = f;
            vela = (f === "tirar" || f === "elegir") && !esSolo() ? "tiro" : null;
        };
        const mostrarTiro = (f) => {
            irA(f);
            lanzarDado(false);
        };
        const lanzarDado = (aterriza) => {
            const t = trayectoriaLanzar(aterriza, reposo, Math.max(1, tablero.clientWidth), Math.max(1, tablero.clientHeight));
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                animLanzar?.cancel();
                animLanzar = null;
                lanzarEl.style.transform = aterriza ? t.fin : "none";
                reposo = aterriza ? t.fin : null;
                return;
            }
            animLanzar?.cancel();
            animLanzar = lanzarEl.animate(t.frames, {
                duration: t.dur,
                easing: "cubic-bezier(.2,.7,.25,1)",
            });
            animLanzar.onfinish = () => {
                animLanzar = null;
                if (!vivo)
                    return;
                lanzarEl.style.transform = t.fin;
                reposo = t.fin;
            };
        };
        const rodarCubo = (tx, ty) => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
                return Promise.resolve();
            animDado?.cancel();
            const anim = cuboEl.animate([
                { transform: `rotateX(${giro.x}deg) rotateY(${giro.y}deg)` },
                { transform: `rotateX(${tx}deg) rotateY(${ty}deg)` },
            ], { duration: 1100, easing: "cubic-bezier(.2,.75,.25,1)" });
            animDado = anim;
            return new Promise((res) => {
                anim.onfinish = () => {
                    animDado = null;
                    res();
                };
            });
        };
        const mostrarResultado = (tx, ty, valor) => {
            if (!vivo)
                return;
            vela = "resultado";
            giro.x = tx;
            giro.y = ty;
            cuboEl.style.transform = `rotateX(${tx}deg) rotateY(${ty}deg)`;
            dado = valor;
            pasos = dado;
            pintar();
            if (tRes !== null)
                clearTimeout(tRes);
            tRes = setTimeout(ocultarResultado, 1600);
        };
        const ocultarResultado = () => {
            if (!vivo)
                return;
            vela = "saliendo";
            pintar();
            if (tSale !== null)
                clearTimeout(tSale);
            tSale = setTimeout(() => {
                if (!vivo)
                    return;
                irA("pasos");
                avisar(null);
                pintar();
            }, 450);
        };
        const tirar = () => {
            if (esSolo() || muriendo || vela !== "tiro")
                return;
            if (fase !== "tirar" && fase !== "elegir")
                return;
            const cara = elegirCara();
            const tx = giroDestino(giro.x, cara.rx);
            const ty = giroDestino(giro.y, cara.ry);
            vela = "rodando";
            lanzarDado(true);
            pintar();
            void rodarCubo(tx, ty).then(() => mostrarResultado(tx, ty, cara.v));
        };
        const pararAnims = () => {
            if (tMuerte !== null)
                clearTimeout(tMuerte);
            if (tNace !== null)
                clearTimeout(tNace);
            if (tCaza !== null)
                clearTimeout(tCaza);
            tMuerte = tNace = tCaza = null;
            muriendo = false;
            muertoIdx = naciendoIdx = cazaIdx = null;
        };
        const registrarPintura = (idx, k) => {
            const j = jugs[idx];
            const vieja = ultimoGolpe.get(idx);
            if (vieja !== undefined && vieja !== k && pinturas.get(vieja) === j.color)
                pinturas.delete(vieja);
            pinturas.set(k, j.color);
            ultimoGolpe.set(idx, k);
        };
        const choque = (ax, ay, bx, by) => {
            if (muriendo)
                return;
            const idx = turno;
            const j = jugs[idx];
            registrarPintura(idx, claveArista(ax, ay, bx, by));
            muertoIdx = idx;
            muriendo = true;
            avisar("lab.choque");
            pintar();
            tMuerte = setTimeout(() => {
                if (!vivo)
                    return;
                j.x = j.ox;
                j.y = j.oy;
                muriendo = false;
                muertoIdx = null;
                naciendoIdx = idx;
                sinAnim = true;
                pintar();
                tNace = setTimeout(() => {
                    if (!vivo)
                        return;
                    naciendoIdx = null;
                    if (esSolo()) {
                        pintar();
                        return;
                    }
                    pasos = 0;
                    turno = (idx + 1) % Math.max(1, jugs.length);
                    dado = null;
                    mostrarTiro("tirar");
                    pintar();
                }, 340);
            }, 400);
        };
        const capturar = () => {
            const j = jugs[turno];
            j.puntos++;
            if (j.puntos >= META) {
                punto = null;
                irA("fin");
                pararReloj();
                avisar(null);
                pintar();
                return;
            }
            punto = colocarPunto(posiciones(), origenes());
            cazaIdx = turno;
            if (tCaza !== null)
                clearTimeout(tCaza);
            tCaza = setTimeout(() => {
                cazaIdx = null;
                if (!vivo)
                    return;
                fichas.get(turno)?.removeAttribute("data-caza");
            }, 320);
            const sig = resolverCaptura(pasos, esSolo());
            if (sig === "quedar") {
                avisar("lab.punto");
                pintar();
                return;
            }
            mostrarTiro(sig);
            avisar("lab.punto");
            pintar();
        };
        const ejecutarPaso = (res) => {
            switch (res.kind) {
                case "fuera":
                    return;
                case "choque":
                    choque(res.ax, res.ay, res.bx, res.by);
                    return;
                case "captura": {
                    const j = jugs[turno];
                    j.x = res.nx;
                    j.y = res.ny;
                    avisar(null);
                    capturar();
                    return;
                }
                case "ok": {
                    const j = jugs[turno];
                    j.x = res.nx;
                    j.y = res.ny;
                    avisar(null);
                    trasMover();
                    return;
                }
            }
        };
        const trasMover = () => {
            if (esSolo()) {
                pintar();
                return;
            }
            pasos--;
            if (pasos <= 0) {
                siguienteTurno();
                return;
            }
            pintar();
        };
        const intentarPaso = (dx, dy) => {
            if (fase !== "pasos" || muriendo)
                return;
            if (!esSolo() && pasos <= 0)
                return;
            const j = jugs[turno];
            ejecutarPaso(validarPaso(j.x, j.y, dx, dy, muros, punto));
        };
        const onSeguir = () => {
            if (fase !== "elegir" || esSolo() || muriendo)
                return;
            irA("pasos");
            avisar(null);
            pintar();
        };
        const onPasar = () => {
            if (fase === "pasos" && !esSolo() && !muriendo && pasos <= 0)
                siguienteTurno();
        };
        const onPad = (e) => {
            const b = e.target?.closest?.("[data-dir]");
            if (!b)
                return;
            const [dx, dy] = (b.getAttribute("data-dir") ?? "0,0").split(",").map(Number);
            intentarPaso(dx, dy);
        };
        const colocarEsquina = (x, y) => {
            const ei = ESQUINAS.findIndex((o) => o.x === x && o.y === y);
            if (ei < 0)
                return;
            if (slots.some((o) => o !== pendiente && o.esq === ei))
                return;
            if (pendiente === null)
                return;
            pendiente.esq = ei;
            pendiente = null;
            avisar(null);
            pintar();
        };
        const onTablero = (e) => {
            if (fase !== "conf" || pendiente === null)
                return;
            const c = e.target?.closest?.(".cel");
            if (!c)
                return;
            const idx = celdas.indexOf(c);
            if (idx < 0)
                return;
            colocarEsquina(idx % LADO, Math.floor(idx / LADO));
        };
        const onNueva = () => {
            pararReloj();
            pararAnims();
            pararTiros();
            animDado?.cancel();
            animDado = null;
            segundos = 0;
            pendiente = null;
            irA("conf");
            avisar(null);
            pintar();
        };
        const onKey = (e) => {
            if (e.isComposing)
                return;
            const t = e.target;
            if (esEditable(t))
                return;
            const acc = accionTecla(e.key, fase, t?.tagName === "BUTTON");
            switch (acc.kind) {
                case "paso":
                    e.preventDefault();
                    intentarPaso(acc.dx, acc.dy);
                    return;
                case "tirar":
                    e.preventDefault();
                    tirar();
                    return;
                case "nada":
                    return;
            }
        };
        const alRedimensionar = () => {
            if (fase === "conf")
                return;
            sinAnim = true;
            pintarFichas();
        };
        const limpiarTodo = () => {
            vivo = false;
            if (animDado !== null) {
                animDado.cancel();
                animDado = null;
            }
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", alRedimensionar);
            pararReloj();
            pararAnims();
            pararTiros();
            stopI18n();
        };
        const cablearEventos = () => {
            empezarBtn.addEventListener("click", iniciarPartida);
            saltarBtn.addEventListener("click", terminarPrevia);
            dado3dEl.addEventListener("click", tirar);
            seguirBtn.addEventListener("click", onSeguir);
            pasarBtn.addEventListener("click", onPasar);
            pad.addEventListener("click", onPad);
            tablero.addEventListener("click", onTablero);
            revanchaBtn.addEventListener("click", iniciarPartida);
            nuevaBtn.addEventListener("click", onNueva);
            window.addEventListener("resize", alRedimensionar);
            window.addEventListener("keydown", onKey);
        };
        armarTablero();
        armarDado();
        pintar();
        cablearEventos();
        onCleanup(limpiarTodo);
    },
});
