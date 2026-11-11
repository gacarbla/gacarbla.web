# gacarbla.web

El sistema de **GACARBLA**. Una escena 3D a pantalla completa: un planeta
personal, una luna para el portfolio y una galaxia de partículas detrás.

La web anterior (el portfolio) vive en
[gacarbla/gacarbla.portfolio](https://github.com/gacarbla/gacarbla.portfolio) y en
<https://portfolio.gacarbla.es/>.

## Cómo funciona

No hay scroll nativo. La página ocupa la pantalla y el gesto se interpreta como
una orden:

- **Sistema** → vista abierta: planeta, anillos, luna y galaxia.
- **Personal** → la cámara se acerca al planeta.
- **Portfolio** → la cámara viaja hasta la luna y se abre la ficha del proyecto.

Rueda, swipe, flechas, `PageUp`/`PageDown`, `Home`/`End` y la barra de etapas
cambian de vista. El gesto se acumula con tolerancia y se bloquea durante la
transición, así que un roce no encadena dos saltos.

Todos los elementos de la escena son persistentes: la cámara se mueve, la luna se
detiene, los anillos giran, el planeta rota y el polvo se desplaza. Nada se monta
ni se desmonta.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `index.html` | Lienzo, HUD, etapas y contenido accesible. |
| `404.html` | Error con el mismo lenguaje visual. |
| `css/main.css` | Interfaz: Sora + Geist Mono, HUD y adaptación móvil. |
| `src/main.js` | Renderer, cámara, etapas, transiciones y bucle. |
| `src/world.js` | Planeta, luna, anillos de partículas, polvo y marcador. |
| `src/backdrop.js` | Galaxia espiral, estrellas, nebulosas y bokeh. |
| `src/materials.js` | Shaders procedurales y material de partículas. |
| `src/input.js` | Rueda, táctil y teclado con umbral de tolerancia. |
| `src/hud.js` | Sincroniza etapas, panel y pista de gesto. |
| `scripts/build.js` | Empaqueta con esbuild, genera `web/` y valida. |
| `scripts/dev.js` | Servidor local con recompilación al vuelo. |
| `assets/fonts/` | Sora y Geist Mono autoalojadas, con sus licencias OFL. |

## Comandos

```bash
npm install
npm run dev      # http://localhost:8081
npm run build    # genera web/
npm run preview  # sirve la versión construida
```

`npm run build` empaqueta `src/main.js` con esbuild, copia el resto de piezas,
genera `robots.txt`, `sitemap.xml`, `CNAME` y `.nojekyll`, y falla si una
referencia local no existe.

## Rendimiento y adaptación

- Sin postprocesado: el brillo se construye con blending aditivo y shaders
  propios. Menos coste y ningún render target intermedio.
- El número de partículas, el `devicePixelRatio` y el encuadre cambian en móvil
  (`pointer: coarse` o menos de 860 px).
- `prefers-reduced-motion` desactiva el vaivén de cámara y acorta las
  transiciones.
- El HUD es HTML real: el proyecto, el enlace y la navegación funcionan con
  teclado y lectores de pantalla. Si no hay WebGL, aparece un respaldo con el
  enlace al portfolio.

## Publicación

Cada push a `main` construye el sitio y publica `web/` en la raíz de la rama
`web`; GitHub Pages la sirve en <https://gacarbla.es/>.
