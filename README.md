# gacarbla.web

El sistema de **GACARBLA**. Una escena orbital en 3D con una estrella central y
cuatro planetas, uno por rama de trabajo, cada uno con su órbita, tamaño,
rotación, traslación e inclinación. Los proyectos son satélites que orbitan su
planeta.

De dentro a fuera:

| Planeta | Órbita | Tamaño | Giro | Traslación | Proyectos |
| --- | --- | --- | --- | --- | --- |
| **Core** | 3.0 | 0.32 | 0.35 | 0.16 | API (`api.gacarbla.es/docs`) |
| **Personal** | 4.8 | 0.45 | 0.12 | 0.11 | CV (`cv.gacarbla.es`), Portfolio (`portfolio.gacarbla.es`) |
| **Herramientas** | 6.6 | 0.38 | 0.20 | 0.08 | MyWeb (`myweb.gacarbla.es`, próximamente) |
| **Pasatiempos** | 8.4 | 0.50 | 0.08 | 0.06 | Games (`games.gacarbla.es`), Play (`play.gacarbla.es`, próximamente) |

## Cómo funciona

La página ocupa la pantalla y no tiene scroll nativo. El gesto avanza por cinco
paradas en ciclo:

```
Sistema → Core → Personal → Herramientas → Pasatiempos → Sistema
```

Al llegar a un planeta, su órbita se resalta y **el planeta sigue su traslación**.
La cámara se desplaza y se acerca para seguirlo; nunca se detiene el planeta, se
mueve la cámara. El escenario se aparta y aparece el panel con los proyectos que
orbitan ese planeta.

Elegir un proyecto ilumina su satélite y transforma el panel en su ficha,
ajustando la altura. La cámara no viaja al satélite: la información vive en el
panel. Los proyectos sin publicar muestran «Próximamente» y no ofrecen enlace.

Rueda, swipe, flechas, `PageUp`/`PageDown` y la barra inferior cambian de parada.
El gesto se acumula con tolerancia y queda bloqueado mientras dura la transición.

Planetas y satélites usan **colores sólidos** y la luz de la estrella. No hay
texturas, ni anillos, ni galaxia decorativa.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `index.html` | Lienzo, HUD, panel y etiquetas. |
| `404.html` | Error con el mismo lenguaje visual. |
| `css/main.css` | Interfaz, panel, etiquetas y adaptación móvil. |
| `src/main.js` | Renderer, cámara, paradas, etiquetas y bucle. |
| `src/data.js` | Planetas, órbitas, tamaños, velocidades y proyectos. |
| `src/system.js` | Estrella, planetas, satélites, órbitas, luces y selección. |
| `src/backdrop.js` | Campo de estrellas. |
| `src/materials.js` | Shaders de la estrella, los halos y las partículas. |
| `src/input.js` | Rueda, táctil y teclado con umbral de tolerancia. |
| `src/hud.js` | Panel dinámico, etapas, alturas y foco. |
| `scripts/build.js` | Empaqueta con esbuild, genera `web/` y valida. |
| `scripts/dev.js` | Servidor local con recompilación al vuelo. |
| `assets/` | Fuentes (Sora y Geist Mono, OFL), favicon y tarjeta social. |

Para añadir una rama basta con añadir una entrada en `src/data.js` y un paso en la
barra de `index.html`. El sistema crea la órbita, el planeta y sus satélites a
partir de los datos.

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
