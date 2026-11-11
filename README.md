# gacarbla.web

El sistema de **GACARBLA**. Una escena orbital en 3D: una estrella central y tres
planetas, uno por rama de trabajo, con sus proyectos orbitando como satélites.

- **Personal** → Portfolio (`portfolio.gacarbla.es`).
- **API** → API (`api.gacarbla.es`, en preparación).
- **Games** → Games (`games.gacarbla.es`).

## Cómo funciona

La página ocupa la pantalla y no tiene scroll nativo. El gesto rota el sistema
entre cuatro paradas, en ciclo:

```
Sistema → Personal → API → Games → Sistema
```

Al llegar a un planeta, este se coloca en la bahía (a la derecha de la estrella),
el escenario se aparta y aparece su panel con los proyectos que lo orbitan.

Elegir un proyecto ilumina su satélite y transforma el panel en la ficha del
proyecto, ajustando la altura. La cámara no viaja al satélite: la información vive
en el panel.

Rueda, swipe, flechas, `PageUp`/`PageDown` y la barra inferior cambian de parada.
El gesto se acumula con tolerancia y queda bloqueado mientras dura la transición.

Los planetas y satélites usan **colores sólidos** y la luz de la estrella. No hay
texturas, ni anillos, ni galaxia decorativa: solo órbitas, cielo de fondo y los
cuerpos del sistema.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `index.html` | Lienzo, HUD, panel y etiquetas. |
| `404.html` | Error con el mismo lenguaje visual. |
| `css/main.css` | Interfaz, panel, etiquetas y adaptación móvil. |
| `src/main.js` | Renderer, cámara, paradas, etiquetas y bucle. |
| `src/data.js` | Planetas, proyectos, colores, dominios y enlaces. |
| `src/system.js` | Estrella, planetas, satélites, órbitas, luces y selección. |
| `src/backdrop.js` | Campo de estrellas. |
| `src/materials.js` | Shaders de la estrella, los halos y las partículas. |
| `src/input.js` | Rueda, táctil y teclado con umbral de tolerancia. |
| `src/hud.js` | Panel dinámico, etapas, alturas y foco. |
| `scripts/build.js` | Empaqueta con esbuild, genera `web/` y valida. |
| `scripts/dev.js` | Servidor local con recompilación al vuelo. |
| `assets/` | Fuentes (Sora y Geist Mono, OFL), favicon y tarjeta social. |

Para añadir una rama basta con añadir una entrada en `src/data.js` y un paso en la
barra de `index.html`. El sistema reparte los planetas en la órbita y crea sus
satélites a partir de los proyectos.

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
  por elementos invisibles. Si no hay WebGL, aparece un respaldo con los enlaces.

## Publicación

Cada push a `main` construye el sitio y publica `web/` en la raíz de la rama
`web`; GitHub Pages la sirve en <https://gacarbla.es/>.
