import { component, routeEvent, type SetupCtx } from "../../lib/rtw/index.js";

/**
 * Fondo decorativo: malla hexagonal ondulante en 3D (efecto plexus).
 * Sin deriva infinita: cada nudo oscila alrededor de su ancla con olas
 * viajeras en Z; doble inclinación X+Y con perspectiva; fundido a bordes
 * para que el tamaño real de la malla sea indescifrable.
 * Todo procedural en Canvas 2D, sin dependencias. Respeta
 * prefers-reduced-motion (un fotograma quieto) y DPR (tope 2).
 * Decorative background: undulating 3D hexagonal mesh (plexus feel).
 * No endless drift: each node oscillates around its anchor with traveling
 * Z waves; dual X+Y tilt with perspective; edge fade so the real mesh
 * size stays hidden. Fully procedural Canvas 2D, zero dependencies.
 * Honors prefers-reduced-motion (one still frame) and DPR (capped at 2).
 *
 * Uso / Usage: <x-fondo></x-fondo> (normalmente en el layout / usually in the layout)
 */
export const Fondo = component("x-fondo", import.meta.url, {
  setup({ shadow, host, onCleanup }: SetupCtx) {
    const canvas = shadow.querySelector("canvas");
    if (!canvas) return;
    const red = new Red(canvas, () => host.dispatchEvent(routeEvent("juegos")));
    red.fijarRuta(rutaInicial());
    /**
     * La mesh vive en el layout (persiste entre rutas): solo escucha
     * el secreto en inicio. rtw:route lo emite la App al pintar.
     * The mesh lives in the layout (persists across routes): only
     * listens for the secret on home. rtw:route is emitted by App.
     */
    const onRuta = (e: Event): void => {
      red.fijarRuta((e as CustomEvent<string>).detail ?? null);
    };
    window.addEventListener("rtw:route", onRuta);
    red.arrancar();
    onCleanup(() => {
      window.removeEventListener("rtw:route", onRuta);
      red.parar();
    });
  },
});

/** Nudo anclado a la retícula con oscilación propia. / Lattice-anchored node with own oscillation. */
interface Nudo {
  /** Ancla en el plano. / Anchor on the plane. */
  x: number;
  y: number;
  /** Fase de la ola. / Wave phase. */
  fase: number;
  /** Amplitud propia (0.7..1.3). / Own amplitude (0.7..1.3). */
  amp: number;
}

/**
 * Red hexagonal (axial pointy-top) con olas viajeras en Z, doble
 * inclinación X+Y y perspectiva. Los enlaces son estructurales
 * (vecinos de retícula), no por distancia.
 * Hexagonal net (pointy-top axial) with traveling Z waves, dual
 * X+Y tilt and perspective. Links are structural (lattice
 * neighbors), not distance-based.
 */
class Red {
  private ctx: CanvasRenderingContext2D | null = null;
  private nudos: Nudo[] = [];
  /** Índices vecinos (3 direcciones para no duplicar aristas). / Neighbor indices (3 dirs to avoid duplicate edges). */
  private aristas: Array<[number, number]> = [];
  /** Filas de la retícula (índices por fila) para enlazar tras sembrar. / Lattice rows (indices per row) for linking after seeding. */
  private filas: number[][] = [];
  /** Índice "fila:col" → nudo para enlazar vecinos. / "row:col" → node index for linking neighbors. */
  private indice = new Map<string, number>();
  private raf = 0;
  private vivo = false;
  private readonly reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** Inclinación: cabeceo X + guiñada Y (radianes). / Tilt: X pitch + Y yaw (radians). */
  private readonly pitch = (48 * Math.PI) / 180;
  private readonly yaw = (-16 * Math.PI) / 180;
  /** Olas: principal lenta + secundaria cruzada (interferencia orgánica). / Waves: slow main + crossed secondary (organic interference). */
  private readonly lambda = 460;
  private readonly omega = 0.18;
  private readonly ampBase = 26;
  private readonly lambda2 = 244;
  private readonly omega2 = 0.3;
  private readonly amp2 = 0.35;
  /** Nudo secreto (easter egg): el más cercano al ancla central. / Secret node (easter egg): nearest to the central anchor. */
  private especial = -1;
  /** Última posición proyectada del secreto (para el puntero). / Last projected position of the secret (for the pointer). */
  private posEspecial: { sx: number; sy: number } | null = null;
  /** Ratón encima del secreto. / Mouse over the secret. */
  private encima = false;
  /** Click mantenido + tiempo acumulado (3 s = 100%). / Held click + accumulated time (3 s = 100%). */
  private pulsando = false;
  private holdT = 0;
  private ultimoT = 0;
  private viajado = false;
  /** Ruta actual (viene de rtw:route). Solo "inicio" arma el secreto. / Current route (from rtw:route). Only "inicio" arms the secret. */
  private ruta: string | null = null;

  /**
   * @param canvas - Lienzo del shadow. / Shadow canvas.
   * @param viajar - Navegación SPA al cuarto de juegos. / SPA navigation to the games room.
   */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly viajar: () => void,
  ) {}

  /**
   * Fija la ruta actual. Al cambiar de ruta se desarma el hold y se
   * rearma el viaje para la próxima visita a inicio.
   * Sets the current route. Changing routes disarms the hold and
   * re-arms travel for the next home visit.
   * @param ruta - Nombre de ruta de rtw:route. / Route name from rtw:route.
   */
  fijarRuta(ruta: string | null): void {
    this.ruta = ruta;
    this.pulsando = false;
    this.holdT = 0;
    this.viajado = false;
    if (ruta !== "inicio") this.encima = false;
    if (ruta !== "inicio") document.body.style.cursor = "";
  }

  /**
   * ¿Secreto armado? Solo en inicio (con fallback al pathname antes
   * del primer rtw:route).
   * Is the secret armed? Only on home (pathname fallback before
   * the first rtw:route).
   */
  private esInicio(): boolean {
    if (this.ruta !== null) return this.ruta === "inicio";
    return rutaInicial() === "inicio";
  }

  /**
   * Dimensiona, siembra la retícula y arranca (o pinta un frame quieto).
   * Sizes, seeds the lattice and starts (or paints one still frame).
   */
  arrancar(): void {
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) return;
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
    const paso = (ahora: number): void => {
      if (!this.vivo) return;
      // La posición es función pura del tiempo: sin estado que integrar.
      // Position is a pure function of time: no state to integrate.
      this.pintar(ahora / 1000);
      this.raf = requestAnimationFrame(paso);
    };
    this.raf = requestAnimationFrame(paso);
  }

  /**
   * Para el bucle y los oyentes.
   * Stops the loop and listeners.
   */
  parar(): void {
    this.vivo = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resembrar);
    window.removeEventListener("pointermove", this.alMover);
    window.removeEventListener("pointerdown", this.alPulsar);
    window.removeEventListener("pointerup", this.alSoltar);
    window.removeEventListener("pointercancel", this.alSoltar);
    document.body.style.cursor = "";
  }

  /**
   * ¿Cae el puntero sobre el secreto (radio en px)?
   * Is the pointer over the secret (radius in px)?
   * @param e - Evento de puntero. / Pointer event.
   * @param radio - Radio en píxeles. / Radius in pixels.
   * @returns true si cae dentro. / true when it lands inside.
   */
  private dentroSecreto(e: PointerEvent, radio: number): boolean {
    const p = this.posEspecial;
    if (!p) return false;
    const dx = e.clientX - p.sx;
    const dy = e.clientY - p.sy;
    return dx * dx + dy * dy < radio * radio;
  }

  /**
   * ¿Cae el puntero sobre contenido interactivo (enlaces, botones…)?
   * Is the pointer over interactive content (links, buttons…)?
   * @param e - Evento de puntero. / Pointer event.
   * @returns true si hay interactivo debajo. / true when interactive content sits below.
   */
  private esInteractivo(e: PointerEvent): boolean {
    const t = e.target as Element | null;
    return !!t?.closest?.("a,button,input,select,textarea,[data-go]");
  }

  /**
   * Rastrea el puntero para el hover del secreto.
   * Tracks the pointer for secret hover.
   */
  private readonly alMover = (e: PointerEvent): void => {
    if (!this.esInicio() || !this.posEspecial) {
      this.encima = false;
      document.body.style.cursor = "";
      return;
    }
    this.encima = this.dentroSecreto(e, 16);
    const interactivo = this.esInteractivo(e);
    document.body.style.cursor = this.encima && !interactivo ? "pointer" : "";
    // El ctx solo es nulo antes de arrancar (sin oyentes): basta el flag.
    // ctx is only null before start (no listeners): the flag suffices.
    if (this.reduceMotion) this.pintar(this.ultimoT);
  };

  /**
   * Inicia la cuenta atrás (3 s) si el click cae sobre el secreto
   * y no sobre contenido interactivo.
   * Starts the countdown (3 s) when the click lands on the secret
   * and not on interactive content.
   */
  private readonly alPulsar = (e: PointerEvent): void => {
    if (!this.esInicio() || !this.posEspecial || this.viajado) return;
    if (!this.dentroSecreto(e, 18)) return;
    if (this.esInteractivo(e)) return;
    this.pulsando = true;
    this.holdT = 0;
  };

  /** Suelta: la cuenta se reinicia. / Release: the count resets. */
  private readonly alSoltar = (): void => {
    this.pulsando = false;
    this.holdT = 0;
  };

  /** Re-siembra al cambiar la ventana. / Re-seeds on window change. */
  private readonly resembrar = (): void => {
    if (!this.ctx) return;
    this.sembrar();
    if (this.reduceMotion) this.pintar(0);
  };

  /**
   * Dimensiona el lienzo a la ventana con DPR capado.
   * Sizes the canvas to the viewport with capped DPR.
   */
  private dimensionar(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    const g = this.ctx as CanvasRenderingContext2D;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Siembra los nudos de la retícula hexagonal (odd-r pointy-top) que
   * cubre la ventana. Mantiene el orden de Math.random (fase, amp).
   * Seeds the hexagonal lattice (pointy-top odd-r) nodes covering the
   * viewport. Keeps the Math.random order (phase, amp).
   */
  private sembrarNudos(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.nudos = [];
    this.aristas = [];
    this.filas = [];
    this.indice = new Map<string, number>();
    const s = 64;
    const dx = Math.sqrt(3) * s;
    const dy = 1.5 * s;
    // Siembra muy por encima del viewport: tras la proyección ningún
    // borde de la retícula puede caer dentro de la pantalla; el fundido
    // siempre tiene malla detrás y el tamaño real no se adivina.
    // Seeds well past the viewport: after projection no lattice edge
    // can land inside the screen; the fade always has mesh behind it.
    const mx = w * 0.45 + dx;
    const my = h * 0.45 + dy;
    let fila = 0;
    for (let y = -my; y < h + my; y += dy, fila++) {
      const impar = fila % 2 === 1;
      const actual: number[] = [];
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

  /**
   * Enlaza E + SE + SW (el resto llega como vecino de otro). El orden
   * topológico (filas en secuencia) garantiza vecinos con índice mayor,
   * así que basta con que existan; los desfases usan aritmética 0/1.
   * Links E + SE + SW (the rest arrives as someone's neighbor). The
   * topological order (sequential rows) guarantees greater neighbor
   * indices, so existence suffices; offsets use 0/1 arithmetic.
   */
  private enlazarAristas(): void {
    const hay = (f: number, c: number): number | undefined => this.indice.get(`${f}:${c}`);
    for (let f = 0; f < this.filas.length; f++) {
      const impar = f % 2 === 1;
      const fila = this.filas[f];
      for (let c = 0; c < fila.length; c++) {
        const este = fila[c];
        const e = hay(f, c + 1);
        const se = hay(f + 1, c + Number(impar));
        const sw = hay(f + 1, c - Number(!impar));
        if (e !== undefined) this.aristas.push([este, e]);
        if (se !== undefined) this.aristas.push([este, se]);
        if (sw !== undefined) this.aristas.push([este, sw]);
      }
    }
  }

  /**
   * Secreto: nudo más cercano al ancla (zona central, fuera del fundido).
   * Secret: node nearest the anchor (central zone, outside the fade).
   */
  private elegirEspecial(): void {
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

  /**
   * Crea la retícula hexagonal (odd-r pointy-top) que cubre la ventana.
   * Las aristas salen de la topología, no de distancias: la red siempre
   * es hexagonal aunque los nudos deriven.
   * Builds the hexagonal lattice (pointy-top odd-r) covering the viewport.
   * Edges come from topology, not distances: the net stays hexagonal
   * while nodes drift.
   */
  private sembrar(): void {
    this.dimensionar();
    this.sembrarNudos();
    this.enlazarAristas();
    this.elegirEspecial();
  }

  /**
   * Proyecta un ancla a pantalla: doble ola en Z + vaivén XY, guiñada Y,
   * cabeceo X y perspectiva. Devuelve también brillo de cresta y fundido.
   * Projects an anchor to screen: dual Z wave + XY sway, Y yaw,
   * X pitch and perspective. Also returns crest glow and edge fade.
   * @param n - Nudo. / Node.
   * @param t - Tiempo en segundos. / Time in seconds.
   * @returns Posición, escala, brillo y fundido. / Position, scale, glow and fade.
   */
  private proyectar(n: Nudo, t: number): { sx: number; sy: number; k: number; borde: number; brillo: number } {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ox = Math.sin(t * 0.14 + n.fase) * 3;
    const oy = Math.cos(t * 0.12 + n.fase * 1.3) * 3;
    const f1 = Math.sin((Math.PI * 2 * (n.x * 0.7 + n.y * 0.7)) / this.lambda - this.omega * t + n.fase);
    const f2 = Math.sin((Math.PI * 2 * (n.x * -0.5 + n.y * 0.86)) / this.lambda2 - this.omega2 * t + n.fase * 1.7);
    const z = n.amp * this.ampBase * (f1 + this.amp2 * f2) / (1 + this.amp2);
    const x = n.x + ox - w / 2;
    const y = n.y + oy - h / 2;
    // Guiñada Y. / Yaw around Y.
    const cy = Math.cos(this.yaw);
    const syaw = Math.sin(this.yaw);
    const x1 = x * cy + z * syaw;
    const z1 = -x * syaw + z * cy;
    // Cabeceo X. / Pitch around X.
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    // Perspectiva suave: la malla llena más pantalla.
    // Gentle perspective: the mesh fills more screen.
    const f = h * 2.2;
    const k = f / (f + z2 + h * 0.5);
    const sx = w / 2 + x1 * k;
    const sy = h / 2 + y2 * k;
    // Fundido a bordes ancho: los extremos se disuelven (tamaño indescifrable).
    // Wide edge fade: ends dissolve (size unknowable).
    const mx = w * 0.3;
    const my = h * 0.32;
    const bx = Math.min(1, Math.min(sx, w - sx) / Math.max(1, mx));
    const by = Math.min(1, Math.min(sy, h - sy) / Math.max(1, my));
    const suave = (v: number): number => {
      const c = Math.max(0, Math.min(1, v));
      return c * c * (3 - 2 * c);
    };
    // Brillo de cresta 0..1 desde la altura de ola. / Crest glow 0..1 from wave height.
    const zn = Math.max(-1, Math.min(1, z / (this.ampBase * 1.2)));
    return { sx, sy, k, borde: suave(bx) * suave(by), brillo: zn * 0.2 + 0.1 };
  }

  /**
   * Avanza la cuenta del click mantenido (3 s = 100%) y viaja al cuarto
   * de juegos al completarla.
   * Advances the held-click count (3 s = 100%) and travels to the games
   * room when complete.
   * @param dt - Segundos desde el frame anterior. / Seconds since the previous frame.
   * @returns true si viajó y el frame debe detenerse. / true when it traveled and the frame must stop.
   */
  private avanzarHold(dt: number): boolean {
    if (!this.pulsando || this.viajado) return false;
    if (!this.esInicio()) {
      this.pulsando = false;
      this.holdT = 0;
      return false;
    }
    this.holdT += dt;
    if (this.holdT < 3) return false;
    this.viajado = true;
    this.pulsando = false;
    this.viajar();
    return true;
  }

  /**
   * Dibuja las aristas tenues (con halo en crestas vivas).
   * Draws the faint edges (with halo on live crests).
   * @param pts - Nudos proyectados. / Projected nodes.
   */
  private pintarAristas(pts: Array<{ sx: number; sy: number; k: number; borde: number; brillo: number }>): void {
    const g = this.ctx as CanvasRenderingContext2D;
    const tinta = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
    g.lineWidth = 1;
    for (const [i, j] of this.aristas) {
      const a = pts[i];
      const b = pts[j];
      if (!a || !b) continue;
      const brillo = Math.max(a.brillo, b.brillo);
      const base = 0.13 * Math.min(a.k, b.k, 1) * Math.min(a.borde, b.borde);
      if (brillo > 0.72) {
        // Halo ancho y tenue bajo la línea viva: falso bloom barato.
        // Wide faint halo under the live line: cheap fake bloom.
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

  /**
   * Dibuja los nudos con brillo en crestas (el secreto, más grande).
   * Draws the nodes with crest glow (the secret, bigger).
   * @param pts - Nudos proyectados. / Projected nodes.
   */
  private pintarNudos(pts: Array<{ sx: number; sy: number; k: number; borde: number; brillo: number }>): void {
    const g = this.ctx as CanvasRenderingContext2D;
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

  /**
   * Dibuja el anillo porcentual del click mantenido.
   * Draws the percent ring of the held click.
   * @param esp - Proyección del nudo secreto. / Secret node projection.
   * @param prog - Progreso 0..1. / Progress 0..1.
   */
  private pintarAnillo(esp: { sx: number; sy: number; k: number; borde: number; brillo: number } | undefined, prog: number): void {
    if (!esp || prog <= 0) return;
    const g = this.ctx as CanvasRenderingContext2D;
    const tinta = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b3541e";
    // Anillo porcentual del color del punto: % del click mantenido.
    // Percent ring in the dot color: % of held click.
    g.strokeStyle = hexA(tinta, 0.9);
    g.lineWidth = 3;
    g.beginPath();
    g.arc(esp.sx, esp.sy, 14, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
    g.stroke();
    g.lineWidth = 1;
  }

  /**
   * Dibuja aristas tenues + nudos con brillo en crestas. Alfa ligada
   * a profundidad y bordes.
   * Draws faint edges + glowing crest nodes. Alpha tied to depth and edges.
   * @param t - Tiempo en segundos. / Time in seconds.
   */
  private pintar(t: number): void {
    const g = this.ctx;
    if (!g) return;
    const dt = Math.min(0.1, Math.max(0, t - this.ultimoT));
    this.ultimoT = t;
    if (this.avanzarHold(dt)) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    g.clearRect(0, 0, w, h);
    const pts = this.nudos.map((n) => this.proyectar(n, t));
    const esp = this.especial >= 0 ? pts[this.especial] : undefined;
    if (esp) this.posEspecial = { sx: esp.sx, sy: esp.sy };
    this.pintarAristas(pts);
    this.pintarNudos(pts);
    this.pintarAnillo(esp, Math.min(1, this.holdT / 3));
  }
}

/**
 * Rutas conocidas por pathname desnudo (sin locale).
 * Known routes by bare pathname (no locale).
 */
const RUTAS: Record<string, string> = {
  "/": "inicio",
  "/games": "juegos",
  "/games/cubo": "cubo",
  "/games/laberinto": "laberinto",
  "/games/tres-en-raya": "tres-en-raya",
  "/jardin": "archivo",
  "/linde": "linde",
  "/cauce/3": "cauce",
  "/umbra": "umbra",
  "/relicario": "relicario",
  "/experiencia": "experiencia",
  "/contacto": "contacto",
};

/**
 * Ruta inicial antes del primer rtw:route: deduce el nombre desde el
 * pathname (tolerando prefijo de locale /es|/en|/gl).
 * Initial route before the first rtw:route: guesses the name from
 * the pathname (tolerating the /es|/en|/gl locale prefix).
 * @returns "inicio", "juegos" u otro nombre conocido. / "inicio", "juegos" or another known name.
 */
function rutaInicial(): string | null {
  const seg = location.pathname.split("/").filter(Boolean);
  // Quita el prefijo de locale si lo hay; el lookup decide el resto.
  // Drops the locale prefix when present; the lookup decides the rest.
  const sinLocale = seg.length > 0 && ["es", "en", "gl"].includes(seg[0] as string) ? seg.slice(1) : seg;
  return RUTAS[`/${sinLocale.join("/")}`] ?? null;
}

/**
 * Aplica alfa a un #rrggbb (los acentos del tema son hex).
 * Applies alpha to a #rrggbb (theme accents are hex).
 * @param hex - Color base. / Base color.
 * @param a - Alfa 0..1. / Alpha 0..1.
 * @returns Color rgba(). / rgba() color.
 */
function hexA(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(120,120,120,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
