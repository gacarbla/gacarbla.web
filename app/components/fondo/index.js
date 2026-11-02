import { component, routeEvent } from "../../lib/rtw/index.js";
export const Fondo = component("x-fondo", import.meta.url, {
    setup({ shadow, host, onCleanup }) {
        const canvas = shadow.querySelector("canvas");
        if (!canvas)
            return;
        const red = new Red(canvas, () => host.dispatchEvent(routeEvent("juegos")));
        red.fijarRuta(rutaInicial());
        const onRuta = (e) => {
            red.fijarRuta(e.detail ?? null);
        };
        window.addEventListener("rtw:route", onRuta);
        red.arrancar();
        onCleanup(() => {
            window.removeEventListener("rtw:route", onRuta);
            red.parar();
        });
    },
});
class Red {
    constructor(canvas, viajar) {
        this.canvas = canvas;
        this.viajar = viajar;
        this.ctx = null;
        this.nudos = [];
        this.aristas = [];
        this.filas = [];
        this.indice = new Map();
        this.raf = 0;
        this.vivo = false;
        this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.pitch = (48 * Math.PI) / 180;
        this.yaw = (-16 * Math.PI) / 180;
        this.lambda = 460;
        this.omega = 0.18;
        this.ampBase = 26;
        this.lambda2 = 244;
        this.omega2 = 0.3;
        this.amp2 = 0.35;
        this.especial = -1;
        this.posEspecial = null;
        this.encima = false;
        this.pulsando = false;
        this.holdT = 0;
        this.ultimoT = 0;
        this.viajado = false;
        this.ruta = null;
        this.alMover = (e) => {
            if (!this.esInicio() || !this.posEspecial) {
                this.encima = false;
                document.body.style.cursor = "";
                return;
            }
            this.encima = this.dentroSecreto(e, 16);
            const interactivo = this.esInteractivo(e);
            document.body.style.cursor = this.encima && !interactivo ? "pointer" : "";
            if (this.reduceMotion)
                this.pintar(this.ultimoT);
        };
        this.alPulsar = (e) => {
            if (!this.esInicio() || !this.posEspecial || this.viajado)
                return;
            if (!this.dentroSecreto(e, 18))
                return;
            if (this.esInteractivo(e))
                return;
            this.pulsando = true;
            this.holdT = 0;
        };
        this.alSoltar = () => {
            this.pulsando = false;
            this.holdT = 0;
        };
        this.resembrar = () => {
            if (!this.ctx)
                return;
            this.sembrar();
            if (this.reduceMotion)
                this.pintar(0);
        };
    }
    fijarRuta(ruta) {
        this.ruta = ruta;
        this.pulsando = false;
        this.holdT = 0;
        this.viajado = false;
        if (ruta !== "inicio")
            this.encima = false;
        if (ruta !== "inicio")
            document.body.style.cursor = "";
    }
    esInicio() {
        if (this.ruta !== null)
            return this.ruta === "inicio";
        return rutaInicial() === "inicio";
    }
    arrancar() {
        this.ctx = this.canvas.getContext("2d");
        if (!this.ctx)
            return;
        this.sembrar();
        window.addEventListener("resize", this.resembrar);
        window.addEventListener("pointermove", this.alMover, { passive: true });
        window.addEventListener("pointerdown", this.alPulsar);
        window.addEventListener("pointerup", this.alSoltar);
        window.addEventListener("pointercancel", this.alSoltar);
        if (this.reduceMotion) {
            this.pintar(1.3);
            return;
        }
        this.vivo = true;
        const paso = (ahora) => {
            if (!this.vivo)
                return;
            this.pintar(ahora / 1000);
            this.raf = requestAnimationFrame(paso);
        };
        this.raf = requestAnimationFrame(paso);
    }
    parar() {
        this.vivo = false;
        cancelAnimationFrame(this.raf);
        window.removeEventListener("resize", this.resembrar);
        window.removeEventListener("pointermove", this.alMover);
        window.removeEventListener("pointerdown", this.alPulsar);
        window.removeEventListener("pointerup", this.alSoltar);
        window.removeEventListener("pointercancel", this.alSoltar);
        document.body.style.cursor = "";
    }
    dentroSecreto(e, radio) {
        const p = this.posEspecial;
        if (!p)
            return false;
        const dx = e.clientX - p.sx;
        const dy = e.clientY - p.sy;
        return dx * dx + dy * dy < radio * radio;
    }
    esInteractivo(e) {
        const t = e.target;
        return !!t?.closest?.("a,button,input,select,textarea,[data-go]");
    }
    dimensionar() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        const g = this.ctx;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sembrarNudos() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.nudos = [];
        this.aristas = [];
        this.filas = [];
        this.indice = new Map();
        const s = 64;
        const dx = Math.sqrt(3) * s;
        const dy = 1.5 * s;
        const mx = w * 0.45 + dx;
        const my = h * 0.45 + dy;
        let fila = 0;
        for (let y = -my; y < h + my; y += dy, fila++) {
            const impar = fila % 2 === 1;
            const actual = [];
            this.filas.push(actual);
            let col = 0;
            for (let x = -mx + (impar ? dx / 2 : 0); x < w + mx; x += dx, col++) {
                this.indice.set(`${fila}:${col}`, this.nudos.length);
                actual.push(this.nudos.length);
                this.nudos.push({
                    x,
                    y,
                    fase: Math.random() * Math.PI * 2,
                    amp: 0.7 + Math.random() * 0.6,
                });
            }
        }
    }
    enlazarAristas() {
        const hay = (f, c) => this.indice.get(`${f}:${c}`);
        for (let f = 0; f < this.filas.length; f++) {
            const impar = f % 2 === 1;
            const fila = this.filas[f];
            for (let c = 0; c < fila.length; c++) {
                const este = fila[c];
                const e = hay(f, c + 1);
                const se = hay(f + 1, c + Number(impar));
                const sw = hay(f + 1, c - Number(!impar));
                if (e !== undefined)
                    this.aristas.push([este, e]);
                if (se !== undefined)
                    this.aristas.push([este, se]);
                if (sw !== undefined)
                    this.aristas.push([este, sw]);
            }
        }
    }
    elegirEspecial() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        let mejor = -1;
        let mejorD = Infinity;
        const ax = w * 0.55;
        const ay = h * 0.4;
        for (let i = 0; i < this.nudos.length; i++) {
            const n = this.nudos[i];
            const d = (n.x - ax) * (n.x - ax) + (n.y - ay) * (n.y - ay);
            if (d < mejorD) {
                mejorD = d;
                mejor = i;
            }
        }
        this.especial = mejor;
    }
    sembrar() {
        this.dimensionar();
        this.sembrarNudos();
        this.enlazarAristas();
        this.elegirEspecial();
    }
    proyectar(n, t) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ox = Math.sin(t * 0.14 + n.fase) * 3;
        const oy = Math.cos(t * 0.12 + n.fase * 1.3) * 3;
        const f1 = Math.sin((Math.PI * 2 * (n.x * 0.7 + n.y * 0.7)) / this.lambda - this.omega * t + n.fase);
        const f2 = Math.sin((Math.PI * 2 * (n.x * -0.5 + n.y * 0.86)) / this.lambda2 - this.omega2 * t + n.fase * 1.7);
        const z = n.amp * this.ampBase * (f1 + this.amp2 * f2) / (1 + this.amp2);
        const x = n.x + ox - w / 2;
        const y = n.y + oy - h / 2;
        const cy = Math.cos(this.yaw);
        const syaw = Math.sin(this.yaw);
        const x1 = x * cy + z * syaw;
        const z1 = -x * syaw + z * cy;
        const cp = Math.cos(this.pitch);
        const sp = Math.sin(this.pitch);
        const y2 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        const f = h * 2.2;
        const k = f / (f + z2 + h * 0.5);
        const sx = w / 2 + x1 * k;
        const sy = h / 2 + y2 * k;
        const mx = w * 0.3;
        const my = h * 0.32;
        const bx = Math.min(1, Math.min(sx, w - sx) / Math.max(1, mx));
        const by = Math.min(1, Math.min(sy, h - sy) / Math.max(1, my));
        const suave = (v) => {
            const c = Math.max(0, Math.min(1, v));
            return c * c * (3 - 2 * c);
        };
        const zn = Math.max(-1, Math.min(1, z / (this.ampBase * 1.2)));
        return { sx, sy, k, borde: suave(bx) * suave(by), brillo: zn * 0.2 + 0.1 };
    }
    avanzarHold(dt) {
        if (!this.pulsando || this.viajado)
            return false;
        if (!this.esInicio()) {
            this.pulsando = false;
            this.holdT = 0;
            return false;
        }
        this.holdT += dt;
        if (this.holdT < 3)
            return false;
        this.viajado = true;
        this.pulsando = false;
        this.viajar();
        return true;
    }
    pintarAristas(pts) {
        const g = this.ctx;
        const tinta = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
        g.lineWidth = 1;
        for (const [i, j] of this.aristas) {
            const a = pts[i];
            const b = pts[j];
            if (!a || !b)
                continue;
            const brillo = Math.max(a.brillo, b.brillo);
            const base = 0.13 * Math.min(a.k, b.k, 1) * Math.min(a.borde, b.borde);
            if (brillo > 0.72) {
                g.strokeStyle = hexA(tinta, base * 0.8);
                g.lineWidth = 2.5;
                g.beginPath();
                g.moveTo(a.sx, a.sy);
                g.lineTo(b.sx, b.sy);
                g.stroke();
                g.lineWidth = 1;
            }
            g.strokeStyle = hexA(tinta, base * (0.45 + 0.9 * brillo));
            g.beginPath();
            g.moveTo(a.sx, a.sy);
            g.lineTo(b.sx, b.sy);
            g.stroke();
        }
    }
    pintarNudos(pts) {
        const g = this.ctx;
        const tinta = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
        const extra = this.encima ? 2.2 : 0;
        const prog = Math.min(1, this.holdT / 3);
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            const esSecreto = i === this.especial;
            const r = (1.6 + 1.6 * p.brillo) * Math.min(p.k, 1.4) + 0.4 + (esSecreto ? extra + prog * 3 : 0);
            g.fillStyle = hexA(tinta, (0.3 + 0.45 * p.brillo) * Math.min(p.k, 1) * p.borde);
            g.beginPath();
            g.arc(p.sx, p.sy, r, 0, Math.PI * 2);
            g.fill();
        }
    }
    pintarAnillo(esp, prog) {
        if (!esp || prog <= 0)
            return;
        const g = this.ctx;
        const tinta = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
        g.strokeStyle = hexA(tinta, 0.9);
        g.lineWidth = 3;
        g.beginPath();
        g.arc(esp.sx, esp.sy, 14, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
        g.stroke();
        g.lineWidth = 1;
    }
    pintar(t) {
        const g = this.ctx;
        if (!g)
            return;
        const dt = Math.min(0.1, Math.max(0, t - this.ultimoT));
        this.ultimoT = t;
        if (this.avanzarHold(dt))
            return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        g.clearRect(0, 0, w, h);
        const pts = this.nudos.map((n) => this.proyectar(n, t));
        const esp = this.especial >= 0 ? pts[this.especial] : undefined;
        if (esp)
            this.posEspecial = { sx: esp.sx, sy: esp.sy };
        this.pintarAristas(pts);
        this.pintarNudos(pts);
        this.pintarAnillo(esp, Math.min(1, this.holdT / 3));
    }
}
const RUTAS = {
    "/": "inicio",
    "/games": "juegos",
    "/games/cubo": "cubo",
    "/games/laberinto": "laberinto",
    "/games/tres-en-raya": "tres-en-raya",
    "/experiencia": "experiencia",
    "/contacto": "contacto",
};
function rutaInicial() {
    const seg = location.pathname.split("/").filter(Boolean);
    const sinLocale = seg.length > 0 && ["es", "en", "gl"].includes(seg[0]) ? seg.slice(1) : seg;
    return RUTAS[`/${sinLocale.join("/")}`] ?? null;
}
function hexA(hex, a) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m)
        return `rgba(120,120,120,${a})`;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
