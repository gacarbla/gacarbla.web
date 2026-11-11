# gacarbla.web

El sistema de **GACARBLA**. Una escena orbital en 3D: una estrella central, un
planeta personal y una luna para el portfolio.

La web anterior (el portfolio) vive en
[gacarbla/gacarbla.portfolio](https://github.com/gacarbla/gacarbla.portfolio) y en
<https://portfolio.gacarbla.es/>.

## Cómo funciona

La página ocupa la pantalla y no tiene scroll nativo. El gesto mueve el sistema
entre tres estados:

1. **Sistema**: la estrella, la órbita y el planeta personal.
2. **Personal**: el planeta se coloca en la bahía y aparece su panel con los
   proyectos que orbitan a su alrededor.
3. **Portfolio**: se elige un proyecto y el panel se transforma en su ficha.

Rueda, swipe, flechas, `PageUp`/`PageDown` y la barra inferior cambian de estado.
El gesto se acumula con tolerancia y queda bloqueado mientras dura la transición.
Al abrirse el panel, el escenario se aparta ligeramente para dejarle sitio; el
panel ajusta su altura y su contenido se desliza entre la vista del planeta y la
del proyecto.

Los proyectos son satélites: al seleccionarlos se iluminan en su órbita, pero la
cámara no viaja hasta ellos. La información vive en el panel.

Los planetas y satélites usan **colores sólidos** y la luz real de la estrella.
No hay texturas, ni anillos, ni galaxia decorativa: solo órbitas, cielo de fondo
y los cuerpos del sistema.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `index.html` | Lienzo, HUD, panel del planeta/proyecto y etiquetas. |
| `404.html` | Error con el mismo lenguaje visual. |
| `css/main.css` | Interfaz, panel, etiquetas y adaptación móvil. |
| `src/main.js` | Renderer, cámara, modos, etiquetas y bucle. |
| `src/system.js` | Estrella, planeta, luna, órbitas, luces y selección. |
| `src/backdrop.js` | Campo de estrellas. |
| `src/materials.js` | Shaders de la estrella, los halos y las partículas. |
| `src/input.js` | Rueda, táctil y teclado con umbral de tolerancia. |
| `src/hud.js` | Estados, panel, alturas y foco de las vistas. |
| `scripts/build.js` | Empaqueta con esbuild, genera `web/` y valida. |
| `scripts/dev.js` | Servidor local con recompilación al vuelo. |
| `assets/` | Fuentes (Sora y Geist Mono, OFL), favicon y tarjeta social. |

## Comandos

```bash
npm install
npm run dev      # http://localhost:8081
npm run build    # genera web/
npm run preview  # sirve la versión construida
```

`npm run build` empaqueta `src/main.js` con esbuild, copia el resto de piezas,
genera `robots.txt`, `sitemap.xml`, `CNAME` y `.nojekyll`, y falla si falta
alguna referencia local.

## Adaptación y accesibilidad

- En vertical la cámara se aleja, se inclina y encuadra el sistema a lo alto; el
  panel pasa a la parte inferior y la barra de etapas, a la superior.
- Menos estrellas y menos `devicePixelRatio` en móvil.
- `prefers-reduced-motion` desactiva el vaivén de cámara.
- El HUD es HTML real; las vistas ocultas quedan `inert` y el foco no se pierde
  por elementos invisibles. Si no hay WebGL, aparece un respaldo con el enlace.

## Publicación

Cada push a `main` construye el sitio y publica `web/` en la raíz de la rama
`web`; GitHub Pages la sirve en <https://gacarbla.es/>.
