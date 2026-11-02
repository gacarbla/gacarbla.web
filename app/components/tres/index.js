import { component } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { jugadaNivel, lineaGanadora, libres, otra } from "./tablero.js";
export const Tres = component("x-tres", import.meta.url, {
    setup({ shadow, host, onCleanup }) {
        const stopI18n = i18n.apply(shadow);
        onCleanup(stopI18n);
        const ref = (n) => shadow.querySelector(`[data-ref="${n}"]`);
        const modoIaBtn = ref("modoIa");
        const modoDuoBtn = ref("modoDuo");
        const dificultadEl = ref("dificultad");
        const difBtns = [ref("dif0"), ref("dif1"), ref("dif2")];
        const estadoEl = ref("estado");
        const turnoMark = ref("turnoMark");
        const tableroEl = ref("tablero");
        const mensajeEl = ref("mensaje");
        const marcadorEl = ref("marcador");
        const reiniciarBtn = ref("reiniciar");
        const cajaEl = ref("caja");
        const validarRefs = () => {
            const vistos = [
                modoIaBtn, modoDuoBtn, dificultadEl, estadoEl, turnoMark, tableroEl,
                mensajeEl, marcadorEl, reiniciarBtn, cajaEl,
                ...difBtns,
            ];
            return vistos.every(Boolean);
        };
        if (!validarRefs()) {
            return;
        }
        let modo = "ia";
        let nivel = 1;
        let celdas = Array(9).fill(null);
        let turno = "X";
        let fin = false;
        let pensando = false;
        let puntos = { X: 0, O: 0, E: 0 };
        let tempor = null;
        let botones = [];
        const leTocaALaMaquina = () => modo === "ia" && turno === "O" && !fin;
        const avisar = (key) => {
            if (key)
                mensajeEl.setAttribute("data-i18n", key);
            else
                mensajeEl.removeAttribute("data-i18n");
            mensajeEl.textContent = "";
            i18n.paint(shadow);
        };
        const marcaBoton = (b, i, g) => {
            b.textContent = celdas[i] ?? "";
            if (celdas[i] === "O")
                b.setAttribute("data-m", "O");
            else
                b.removeAttribute("data-m");
            if (g?.includes(i))
                b.setAttribute("data-gana", "");
            else
                b.removeAttribute("data-gana");
        };
        const estadoBoton = (b, i) => {
            if (celdas[i] || fin || pensando || leTocaALaMaquina())
                b.setAttribute("disabled", "");
            else
                b.removeAttribute("disabled");
        };
        const pintar = () => {
            modoIaBtn.toggleAttribute("data-on", modo === "ia");
            modoDuoBtn.toggleAttribute("data-on", modo === "duo");
            const sinDificultad = modo !== "ia";
            dificultadEl.toggleAttribute("data-vacio", sinDificultad);
            dificultadEl.setAttribute("aria-hidden", String(sinDificultad));
            difBtns.forEach((b, i) => {
                if (!b)
                    return;
                b.toggleAttribute("data-on", i === nivel);
                if (sinDificultad)
                    b.setAttribute("disabled", "");
                else
                    b.removeAttribute("disabled");
            });
            const g = lineaGanadora(celdas);
            botones.forEach((b, i) => {
                marcaBoton(b, i, g);
                estadoBoton(b, i);
            });
            estadoEl.toggleAttribute("data-vacio", fin);
            if (!fin)
                turnoMark.textContent = turno;
            marcadorEl.innerHTML = "";
            const orden = [
                { etiqueta: "X", clave: null, tantos: puntos.X },
                { etiqueta: null, clave: "tres.empates", tantos: puntos.E },
                { etiqueta: "O", clave: null, tantos: puntos.O },
            ];
            for (const f of orden) {
                const s = document.createElement("span");
                s.className = "ficha";
                if (f.etiqueta) {
                    const d = document.createElement("strong");
                    d.textContent = f.etiqueta;
                    if (f.etiqueta === "O")
                        d.style.color = "var(--accent)";
                    s.appendChild(d);
                }
                else if (f.clave) {
                    const d = document.createElement("span");
                    d.setAttribute("data-i18n", f.clave);
                    s.appendChild(d);
                }
                const t = document.createElement("span");
                t.textContent = `×${f.tantos}`;
                s.appendChild(t);
                marcadorEl.appendChild(s);
            }
            i18n.paint(shadow);
        };
        const aplicarJugada = (i, marca) => {
            celdas[i] = marca;
            if (lineaGanadora(celdas))
                return "gana";
            if (libres(celdas).length === 0)
                return "tablas";
            turno = otra(marca);
            return "sigue";
        };
        const cerrar = (ganadora) => {
            fin = true;
            pensando = false;
            if (ganadora) {
                puntos[ganadora]++;
                avisar(ganadora === "X" ? "tres.gana_x" : "tres.gana_o");
            }
            else {
                puntos.E++;
                avisar("tres.empate");
            }
            pintar();
        };
        const pensarPaso = () => {
            if (!host.isConnected)
                return;
            const j = jugadaNivel(celdas, "O", nivel);
            const r = aplicarJugada(j, "O");
            if (r === "gana") {
                cerrar("O");
                return;
            }
            if (r === "tablas") {
                cerrar(null);
                return;
            }
            pensando = false;
            avisar(null);
            pintar();
        };
        const pensar = () => {
            if (!leTocaALaMaquina())
                return;
            pensando = true;
            pintar();
            if (tempor !== null)
                clearTimeout(tempor);
            tempor = setTimeout(pensarPaso, 450);
        };
        const resolverJugada = (r, marca) => {
            if (r === "gana") {
                cerrar(marca);
                return;
            }
            if (r === "tablas") {
                cerrar(null);
                return;
            }
            avisar(null);
            pintar();
            pensar();
        };
        const jugar = (i) => {
            if (fin || pensando || celdas[i])
                return;
            if (leTocaALaMaquina())
                return;
            resolverJugada(aplicarJugada(i, turno), turno);
        };
        const reiniciar = () => {
            if (tempor !== null)
                clearTimeout(tempor);
            celdas = Array(9).fill(null);
            turno = "X";
            fin = false;
            pensando = false;
            avisar(null);
            pintar();
        };
        const construirTablero = () => {
            tableroEl.innerHTML = "";
            botones = [];
            for (let i = 0; i < 9; i++) {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "cel";
                b.setAttribute("role", "gridcell");
                b.setAttribute("aria-label", String(i + 1));
                b.addEventListener("click", () => jugar(i));
                tableroEl.appendChild(b);
                botones.push(b);
            }
        };
        const enlazarControles = () => {
            modoIaBtn.addEventListener("click", () => {
                modo = "ia";
                reiniciar();
            });
            modoDuoBtn.addEventListener("click", () => {
                modo = "duo";
                reiniciar();
            });
            difBtns.forEach((b, i) => b?.addEventListener("click", () => {
                nivel = i;
                reiniciar();
            }));
            reiniciarBtn.addEventListener("click", reiniciar);
            onCleanup(() => {
                if (tempor !== null)
                    clearTimeout(tempor);
            });
        };
        construirTablero();
        pintar();
        enlazarControles();
    },
});
