# gacarbla.web

El portal de **GACARBLA**: un autor, muchos mundos.

La web antigua (el portfolio) vive ahora en
[gacarbla/gacarbla.portfolio](https://github.com/gacarbla/gacarbla.portfolio) y en
<https://portfolio.gacarbla.es/>. Este repositorio es la portada de todo lo demás.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `index.html` | Portada: entrada y recorrido por los mundos, con la constelación en una lente fija. |
| `404.html` | Página de error, mismo lenguaje visual. |
| `css/main.css` | Hoja única: papel, tinta, tipografía, retícula y estados. |
| `js/main.js` | Avanza la constelación con el scroll, marca el mundo activo y mueve el reloj de Madrid. Sin dependencias. |
| `assets/fonts/` | Instrument Serif y JetBrains Mono autoalojadas, con sus licencias OFL. |
| `assets/og.png` | Tarjeta social 1200 × 630. |
| `design/og.html` | Composición fuente de la tarjeta social. |
| `scripts/build.js` | Genera `web/` y valida que no falte ningún recurso. |
| `scripts/dev.js` | Servidor estático local, sin dependencias. |
| `.github/workflows/deploy.yml` | Construye y publica `web/` en la rama `web`. |

## Comandos

```bash
npm run dev      # http://localhost:8081
npm run build    # genera web/
npm run preview  # sirve web/ en http://localhost:8081
```

`npm run build` no tiene dependencias: copia la página, genera `robots.txt`,
`sitemap.xml`, `CNAME` y `.nojekyll`, y falla si una referencia local no existe.

## Publicación

Cada push a `main` ejecuta el workflow, que publica el contenido de `web/` en la
raíz de la rama `web`. GitHub Pages sirve esa rama en <https://gacarbla.es/>.
Mientras el proyecto no tenga `package.json` y `package-lock.json`, el workflow no
construye ni publica nada.

## Añadir un mundo

1. Añade un `<section class="chapter">` en `index.html`, dentro de `.story`, con
   `id`, `data-world`, su índice, nombre, descripción y metadatos.
2. Añade su nodo y su arista en la lente (`data-node` y `data-edge` con el mismo
   identificador) y, si quieres, su marca en `.lens-ticks`.
3. Define su color en `css/main.css` (`--w-<id>` y `--w-<id>-mark`).
4. Actualiza los contadores visibles («06 mundos · 01 en línea»).
5. Regenera la tarjeta social si cambia el mapa:

```bash
npx playwright screenshot --channel chrome --viewport-size="1200,630" \
  --wait-for-timeout=1800 http://localhost:8081/design/og.html assets/og.png
```

## Criterios

- Sin frameworks ni dependencias en producción.
- HTML legible y navegable sin JavaScript.
- Fuentes autoalojadas, sin peticiones a terceros.
- Sin cookies, sin analítica y sin rastreadores.
- Contraste, foco visible y `prefers-reduced-motion` cuidados.
