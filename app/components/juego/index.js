import { component } from "../../lib/rtw/index.js";
import { i18n } from "../../lang/index.js";
import { FISICA, bolsa, tramo, verifica } from "./nivel.js";
class SesionJuego {
    constructor(host, root, canvas, cerrar, esFull, g) {
        this.host = host;
        this.root = root;
        this.canvas = canvas;
        this.cerrar = cerrar;
        this.esFull = esFull;
        this.g = g;
        this.cola = "";
        this.abrir = () => {
            this.root.setAttribute("data-on", "");
            this.g.empezar();
        };
        this.cerrarTodo = () => {
            this.root.removeAttribute("data-on");
            this.g.parar();
        };
        this.reiniciar = () => {
            this.g.empezar();
        };
        this.arrancar = () => {
            if (this.host.isConnected)
                this.g.empezar();
        };
        this.mostrarSegunModo = () => {
            if (!this.esFull) {
                this.cerrar?.addEventListener("click", this.cerrarTodo);
                return;
            }
            this.root.setAttribute("data-on", "");
            this.root.setAttribute("data-full", "");
            requestAnimationFrame(this.arrancar);
            this.cerrar?.addEventListener("click", this.reiniciar);
        };
        this.desconectarCierre = () => {
            this.cerrar?.removeEventListener("click", this.cerrarTodo);
            this.cerrar?.removeEventListener("click", this.reiniciar);
        };
        this.esTeclaJuego = (e) => {
            if (e.isComposing)
                return false;
            const t = e.target;
            const etiqueta = t?.tagName ?? "";
            if (etiqueta === "INPUT" || etiqueta === "TEXTAREA" || etiqueta === "SELECT")
                return false;
            return true;
        };
        this.consumeSecretoPlay = (e) => {
            if (this.esFull || !/^[a-zA-Z]$/.test(e.key))
                return false;
            this.cola = (this.cola + e.key.toLowerCase()).slice(-4);
            if (this.cola !== "play" || !this.host.isConnected)
                return false;
            this.cola = "";
            this.abrir();
            return true;
        };
        this.gestionaAbierto = (e) => {
            if (!this.g.abierto)
                return false;
            if (e.key === "Escape") {
                if (!this.esFull)
                    this.cerrarTodo();
                return true;
            }
            if (e.key === " " || e.key === "ArrowUp") {
                e.preventDefault();
                this.g.pulsar(true);
                return true;
            }
            return false;
        };
        this.tratarTecla = (e) => {
            if (!this.esTeclaJuego(e))
                return;
            if (this.consumeSecretoPlay(e))
                return;
            this.gestionaAbierto(e);
        };
        this.soltarTecla = (e) => {
            if (e.key === " " || e.key === "ArrowUp")
                this.g.pulsar(false);
        };
        this.pulsarDentro = (e) => {
            e.preventDefault();
            this.g.pulsar(true);
            const soltar = () => {
                this.g.pulsar(false);
                window.removeEventListener("pointerup", soltar);
                window.removeEventListener("pointercancel", soltar);
            };
            window.addEventListener("pointerup", soltar);
            window.addEventListener("pointercancel", soltar);
        };
    }
}
export const Juego = component("x-juego", import.meta.url, {
    attrs: ["modo"],
    setup({ shadow, host, attr, onCleanup }) {
        const stopI18n = i18n.apply(shadow);
        onCleanup(stopI18n);
        const root = shadow.querySelector(".juego");
        const canvas = shadow.querySelector("canvas");
        const marca = shadow.querySelector(".marca");
        const cerrar = shadow.querySelector(".cerrar");
        if (!root || !canvas)
            return;
        const esFull = (attr("modo") ?? host.getAttribute("modo") ?? "").toLowerCase() === "full";
        const g = new Partida(canvas, (texto) => {
            if (marca)
                marca.textContent = texto;
        }, (corriendo) => {
            if (corriendo)
                root.removeAttribute("data-espera");
            else
                root.setAttribute("data-espera", "");
        });
        const sesion = new SesionJuego(host, root, canvas, cerrar, esFull, g);
        canvas.addEventListener("pointerdown", sesion.pulsarDentro);
        window.addEventListener("keydown", sesion.tratarTecla);
        window.addEventListener("keyup", sesion.soltarTecla);
        sesion.mostrarSegunModo();
        onCleanup(() => {
            window.removeEventListener("keydown", sesion.tratarTecla);
            window.removeEventListener("keyup", sesion.soltarTecla);
            canvas.removeEventListener("pointerdown", sesion.pulsarDentro);
            sesion.desconectarCierre();
            g.parar();
        });
    },
});
class Partida {
    constructor(canvas, pintarHud, alEstado) {
        this.canvas = canvas;
        this.pintarHud = pintarHud;
        this.alEstado = alEstado;
        this.abierto = false;
        this.ctx = null;
        this.raf = 0;
        this.vivo = false;
        this.ultimo = 0;
        this.sueloY = 0;
        this.dist = 0;
        this.desfile = 0;
        this.corriendo = false;
        this.mejor = 0;
        this.intentos = 0;
        this.obs = [];
        this.pads = [];
        this.orbes = [];
        this.proxima = 0;
        this.jy = 0;
        this.vy = 0;
        this.enSuelo = true;
        this.ang = 0;
        this.agachado = false;
        this.intro = 0;
        this.pulsado = false;
        this.subiendo = 0;
        this.aire = 0;
        this.colaSalto = 0;
        this.muerto = 0;
        this.estela = [];
        this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.ajustar = () => {
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const r = this.canvas.getBoundingClientRect();
            this.canvas.width = Math.max(1, Math.round(r.width * dpr));
            this.canvas.height = Math.max(1, Math.round(r.height * dpr));
            const g = this.ctx;
            if (g)
                g.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.sueloY = r.height - 64;
            this.jy = this.sueloY - 32;
        };
        this.paso = (ahora) => {
            if (!this.vivo)
                return;
            const dt = Math.min(50, ahora - this.ultimo) / 1000;
            this.ultimo = ahora;
            if (this.intro < 1) {
                this.intro = Math.min(1, this.intro + dt / 0.85);
            }
            else if (this.muerto > 0) {
                this.muerto -= dt;
                if (this.muerto <= 0)
                    this.aEspera();
            }
            else if (this.corriendo) {
                this.avanzar(dt);
            }
            else {
                this.esperar(dt);
            }
            this.dibujar();
            this.raf = requestAnimationFrame(this.paso);
        };
        try {
            this.mejor = Number(localStorage.getItem("rtw:gplay") ?? 0) || 0;
        }
        catch {
            this.mejor = 0;
        }
    }
    empezar() {
        this.ctx = this.canvas.getContext("2d");
        if (!this.ctx)
            return;
        this.ajustar();
        window.addEventListener("resize", this.ajustar);
        this.abierto = true;
        this.intro = 0;
        this.dist = 0;
        this.corriendo = false;
        this.obs = [];
        this.pads = [];
        this.orbes = [];
        this.proxima = 500;
        this.vy = 0;
        this.enSuelo = true;
        this.ang = 0;
        this.muerto = 0;
        this.estela = [];
        this.intentos++;
        this.marca();
        this.alEstado(false);
        if (this.vivo)
            return;
        this.vivo = true;
        this.ultimo = performance.now();
        this.raf = requestAnimationFrame(this.paso);
    }
    parar() {
        this.vivo = false;
        this.abierto = false;
        cancelAnimationFrame(this.raf);
        window.removeEventListener("resize", this.ajustar);
    }
    arrancaSiPrimera() {
        if (this.corriendo)
            return;
        this.corriendo = true;
        this.alEstado(true);
    }
    pulsar(dentro) {
        if (!this.abierto || this.muerto > 0)
            return;
        if (dentro && this.intro >= 1) {
            this.arrancaSiPrimera();
            this.colaSalto = 0.12;
            if (!this.intentarSalto())
                this.intentarOrbe();
        }
        this.pulsado = dentro;
    }
    intentarSalto() {
        if (this.enSuelo || this.aire < 0.08) {
            this.vy = -FISICA.vSalto;
            this.enSuelo = false;
            this.subiendo = 0;
            this.colaSalto = 0;
            return true;
        }
        return false;
    }
    intentarOrbe() {
        for (const o of this.orbes) {
            const dx = this.px() - o.x;
            const dy = this.jy + 16 - o.y;
            if (dx * dx + dy * dy < 40 * 40) {
                this.vy = -FISICA.vOrbe;
                this.subiendo = 0;
                this.colaSalto = 0;
                break;
            }
        }
    }
    marca() {
        const m = Math.floor(this.dist / 50);
        if (m > this.mejor) {
            this.mejor = m;
            try {
                localStorage.setItem("rtw:gplay", String(m));
            }
            catch {
            }
        }
        this.pintarHud(`×${this.intentos} · ${m}m · ★${this.mejor}m`);
    }
    aEspera() {
        this.obs = [];
        this.pads = [];
        this.orbes = [];
        this.dist = 0;
        this.proxima = 500;
        this.vy = 0;
        this.enSuelo = true;
        this.corriendo = false;
        this.ang = Math.round(this.ang / (Math.PI / 2)) * (Math.PI / 2);
        this.jy = this.sueloY - 32;
        this.marca();
        this.alEstado(false);
    }
    esperar(dt) {
        this.desfile += FISICA.vel * dt;
        this.jy = this.sueloY - 32;
        for (const e of this.estela)
            e.a -= dt * 1.4;
    }
    integrarCubo(dt) {
        this.colaSalto = Math.max(0, this.colaSalto - dt);
        if (this.enSuelo) {
            this.jy = this.sueloY - 32;
            this.aire = 0;
            if (this.colaSalto > 0)
                this.intentarSalto();
            return;
        }
        this.aire += dt;
        const ayuda = Number(this.pulsado) & Number(this.subiendo < 0.16) & Number(this.vy < 0);
        const g = [FISICA.gravedad, FISICA.gravedad * 0.45][ayuda];
        this.subiendo += dt;
        this.vy += g * dt;
        this.jy += this.vy * dt;
        if (!this.reduceMotion)
            this.ang += 5.5 * dt;
        if (this.jy >= this.sueloY - 32) {
            this.jy = this.sueloY - 32;
            this.vy = 0;
            this.enSuelo = true;
            this.ang = Math.round(this.ang / (Math.PI / 2)) * (Math.PI / 2);
        }
    }
    desplazarMundo(dt) {
        const VEL = FISICA.vel;
        for (const o of this.obs)
            o.x -= VEL * dt;
        for (const p of this.pads)
            p.x -= VEL * dt;
        for (const o of this.orbes)
            o.x -= VEL * dt;
        this.obs = this.obs.filter((o) => o.x + o.w > -60);
        this.pads = this.pads.filter((p) => p.x + p.w > -60);
        this.orbes = this.orbes.filter((o) => o.x > -60);
        this.proxima -= VEL * dt;
        if (this.proxima <= 0)
            this.generar();
    }
    actualizarEstela(dt) {
        this.estela.unshift({ x: this.px(), y: this.jy + 16, a: 0.5 });
        if (this.estela.length > 14)
            this.estela.pop();
        for (const e of this.estela)
            e.a -= dt * 1.4;
    }
    avanzar(dt) {
        this.dist += FISICA.vel * dt;
        this.integrarCubo(dt);
        this.desplazarMundo(dt);
        this.chocar();
        this.actualizarEstela(dt);
        this.marca();
    }
    startX() {
        const w = this.ancho();
        return Math.max(90, Math.round(w * 0.2));
    }
    px() {
        const e = 1 - Math.pow(1 - this.intro, 3);
        return -50 + (this.startX() + 50) * e;
    }
    generar() {
        const x = this.ancho() + 40;
        const d = Math.min(4, Math.floor(this.dist / 1200));
        const bolsaIds = bolsa(d);
        const id = bolsaIds[Math.floor(Math.random() * bolsaIds.length)];
        const t = tramo(id, x, this.sueloY);
        const fallos = verifica(t, this.sueloY);
        if (fallos.length > 0) {
            console.error(`[juego] tramo ${id} imposible, uso pincho simple / impossible stretch, using single spike:`, fallos.join("; "));
            this.obs.push({ x, w: 26, h: 26 });
            this.proxima = 360 + Math.random() * 220;
            return;
        }
        for (const o of t.obs)
            this.obs.push(o);
        for (const p of t.pads)
            this.pads.push(p);
        for (const o of t.orbes)
            this.orbes.push(o);
        this.proxima = Math.max(300, t.ancho + 300 + Math.random() * 240);
    }
    ancho() {
        return this.canvas.getBoundingClientRect().width || window.innerWidth;
    }
    chocarCojines() {
        const px = this.px();
        const jx0 = px - 16;
        const jx1 = px + 16;
        const jy1 = this.jy + 32;
        for (const p of this.pads) {
            const solapa = Number(jx1 > p.x) & Number(jx0 < p.x + p.w);
            const cae = Number(this.enSuelo) | Number(this.vy >= 0);
            const toca = Number(jy1 >= this.sueloY - 14);
            if (solapa & cae & toca) {
                this.vy = -FISICA.vCojin;
                this.enSuelo = false;
                this.subiendo = 0;
            }
        }
    }
    chocarPinchos() {
        const px = this.px();
        const jx0 = px - 16;
        const jx1 = px + 16;
        const jy1 = this.jy + 32;
        for (const o of this.obs) {
            const ox0 = o.x;
            const ox1 = o.x + o.w;
            if (Number(jx1 <= ox0 + 4) | Number(jx0 >= ox1 - 4))
                continue;
            const top = this.sueloY - o.h;
            const m = 9;
            if (Number(jx1 > ox0 + m) & Number(jx0 < ox1 - m) & Number(jy1 > top + m)) {
                this.morir();
                return true;
            }
        }
        return false;
    }
    chocar() {
        this.chocarCojines();
        if (this.chocarPinchos())
            return;
    }
    morir() {
        this.dist = 0;
        this.muerto = 0.7;
        this.intentos++;
        this.marca();
    }
    pintarSuelo(ancho) {
        const g = this.ctx;
        g.fillStyle = "#f2ede3";
        g.globalAlpha = 0.5;
        g.fillRect(0, this.sueloY, ancho, 2);
        g.globalAlpha = 0.25;
        const marcha = this.corriendo ? this.dist : this.desfile;
        const off = this.muerto > 0 ? 0 : marcha % 60;
        for (let x = -off; x < ancho; x += 60)
            g.fillRect(x, this.sueloY + 8, 24, 2);
        g.globalAlpha = 1;
    }
    pintarEstela() {
        const g = this.ctx;
        const acento = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
        for (const e of this.estela) {
            if (e.a <= 0)
                continue;
            g.fillStyle = acento;
            g.globalAlpha = Math.max(0, e.a * 0.5);
            g.fillRect(e.x - 8, e.y - 8, 16, 16);
        }
        g.globalAlpha = 1;
    }
    pintarPinchos() {
        const g = this.ctx;
        for (const o of this.obs) {
            g.fillStyle = "#f2ede3";
            const n = Math.max(1, Math.round(o.w / 26));
            for (let i = 0; i < n; i++) {
                const x0 = o.x + (i * o.w) / n;
                const x1 = o.x + ((i + 1) * o.w) / n;
                g.beginPath();
                g.moveTo(x0, this.sueloY);
                g.lineTo((x0 + x1) / 2, this.sueloY - o.h);
                g.lineTo(x1, this.sueloY);
                g.closePath();
                g.fill();
            }
        }
    }
    pintarPadsOrbes(ahora) {
        const g = this.ctx;
        for (const p of this.pads) {
            g.fillStyle = "#ffd23f";
            g.fillRect(p.x, this.sueloY - 12, p.w, 12);
            g.fillStyle = "#8a5a2b";
            for (let x = p.x + 4; x < p.x + p.w - 4; x += 10)
                g.fillRect(x, this.sueloY - 12, 4, 12);
        }
        for (const o of this.orbes) {
            const r = 14 + Math.sin(ahora * 5 + o.x) * 2;
            g.strokeStyle = "#ffd23f";
            g.lineWidth = 3;
            g.beginPath();
            g.arc(o.x, o.y, r, 0, Math.PI * 2);
            g.stroke();
            g.fillStyle = "#faf8f4";
            g.beginPath();
            g.arc(o.x, o.y, 4, 0, Math.PI * 2);
            g.fill();
            g.lineWidth = 1;
        }
    }
    pintarCubo() {
        const g = this.ctx;
        const acento = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
        const px = this.px();
        g.save();
        g.translate(px, this.jy + 16);
        g.rotate(this.ang);
        g.fillStyle = this.muerto > 0 ? "#e05252" : acento;
        g.fillRect(-16, -16, 32, 32);
        g.fillStyle = "#f2ede3";
        g.fillRect(-8, -8, 16, 16);
        g.restore();
    }
    dibujar() {
        const g = this.ctx;
        if (!g)
            return;
        const r = this.canvas.getBoundingClientRect();
        const w = r.width;
        const h = r.height;
        g.clearRect(0, 0, w, h);
        this.pintarSuelo(w);
        this.pintarEstela();
        this.pintarPinchos();
        this.pintarPadsOrbes(performance.now() / 1000);
        this.pintarCubo();
    }
}
