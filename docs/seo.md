# SEO técnico / Technical SEO

## Qué genera el build

`npm run build` crea en `web/`:

- **65 páginas HTML** con head propio:
  - raíz `/` (canonical a `/es/`, `noindex,follow`);
  - `404.html` real (`noindex,nofollow`, sin canonical);
  - **49 páginas públicas** = 7 idiomas × 7 rutas;
  - **14 páginas gatuno** (`/es-cat`, `/en-cat` × 7 rutas, `noindex,follow`).
- `sitemap.xml` con las **49 URLs públicas**, con barra final y `lastmod`.
- `robots.txt` con `Sitemap` y `Disallow` para las rutas secretas del juego y los
  idiomas gatuno.
- `app/` y `assets/`, incluidas las banderas y la tarjeta social.

Cada página pública lleva:

- `lang` correcto (`pt-PT` para `/pt`, `pt-BR` para `/pt-BR`).
- `title` y `meta description` localizados.
- `canonical` autorreferente y con barra final.
- `hreflang` recíproco para `es`, `en`, `gl`, `pt-PT`, `pt-BR`, `fr`, `it` y
  `x-default` a la versión española.
- Open Graph y Twitter Card propios.
- `robots: index,follow,max-image-preview:large`.
- JSON-LD: `Person`, `WebSite`, página (`ProfilePage`, `AboutPage`, `ContactPage`,
  `CollectionPage`, `WebPage`), `BreadcrumbList` y `VideoGame`/`ItemList` en los juegos.
- Contenido estático crawleable: nav, footer, enlaces internos y resumen de la página.

## Rutas

Las URLs canónicas usan prefijo de idioma y barra final:

```text
/es/  /en/  /gl/  /pt/  /pt-BR/  /fr/  /it/
/es/experiencia/  /es/contacto/  /es/games/
/es/games/cubo/  /es/games/laberinto/  /es/games/tres-en-raya/
```

El router normaliza la barra final para casar rutas, y `pathOf()` genera enlaces
internos con barra final. Los enlaces estáticos del nav/footer también la llevan.

La raíz `/` redirige en cliente a `/es/`; su canonical es `/es/` y es `noindex`.
Para una redirección 301 real hace falta una regla de servidor (Cloudflare), no
GitHub Pages.

## Fuera de índice

- `/jardin`, `/linde`, `/cauce/3`, `/umbra`, `/relicario`: secretas; `robots.txt`
  las excluye y el fallback sirve `404.html` con `noindex`.
- `/es-cat/`, `/en-cat/`: existen y funcionan, pero van con `noindex` y fuera de
  sitemap/hreflang.
- `404.html`: `noindex,nofollow`, sin canonical.

## Comprobación

```bash
npm run typecheck
npm run build
npx serve web
```

Con el servidor estático (sin `serve.json`, como GitHub Pages):

```bash
curl -sI http://localhost:3000/es/experiencia/       # 200
curl -sI http://localhost:3000/pt-BR/                # 200
curl -sI http://localhost:3000/foo                   # 404
curl -s  http://localhost:3000/sitemap.xml | grep -c '<loc>'   # 49
curl -s  http://localhost:3000/robots.txt
```

El HTML fuente de cada página debe llevar canonical, hreflang, robots y JSON-LD
antes de ejecutar JS. `scripts/check-build.js` falla si falta una página del
sitemap, si el 404 no es `noindex` o si el canonical de `/es/` no es propio.

## Search Console

1. Verificar `gacarbla.es`.
2. Enviar `https://gacarbla.es/sitemap.xml`.
3. Inspeccionar `/es/`, `/es/experiencia/`, `/pt-BR/games/cubo/`.
4. Confirmar 200, canonical autorreferente, hreflang recíproco y `noindex` en
   `/es-cat/` y en las rutas del juego.
5. Revisar “Página alternativa con etiqueta canónica” y “Duplicada” tras el despliegue.

## Cloudflare

La allowlist de bots oficiales y seguros no-IA está activa. Si una tarjeta o una
inspección deja de funcionar, comprobar que el user-agent siga permitido y que no se
haya activado Under Attack Mode / Bot Fight Mode.
