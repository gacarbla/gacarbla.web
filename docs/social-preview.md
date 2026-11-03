# Vistas previas sociales / Social link previews

## Qué hay

- Etiquetas **Open Graph** y **Twitter Card** en `index.html`: título, descripción, URL
  canónica, imagen absoluta, dimensiones, alt, locale y locales alternativos.
- Tarjeta **1200×630** en `assets/og.png` (108 KB, por debajo del límite habitual de
  WhatsApp).
- Generador reproducible: `scripts/og-image.ps1` (PowerShell + System.Drawing).
  Usa el retrato enmarcado sobre panel claro, la paleta y la tipografía de la web.
- `404.html` es una copia de `index.html`, así que también lleva las etiquetas.

## Cloudflare

Cloudflare está configurado para permitir los bots oficiales y seguros que no sean de
IA. Discord, WhatsApp, Telegram, Twitter/X y LinkedIn pueden leer las etiquetas y la
imagen. Si alguna tarjeta deja de aparecer, comprobar que el user-agent del cliente
siga en la allowlist y que no se haya activado Under Attack Mode / Bot Fight Mode.

## Refrescar la caché

- **Facebook / WhatsApp**: Sharing Debugger → pegar la URL → *Scrape Again*.
- **Telegram**: enviar la URL a `@WebpageBot`.
- **Discord**: volver a pegar el enlace; si conserva la tarjeta vieja, esperar o usar
  una URL con query distinta para forzar el refresco.
- **Twitter/X**: volver a publicar el enlace.

## Rutas profundas

La web es una SPA. Las rutas profundas (`/experiencia`, `/pt-BR`, etc.) usan el
`404.html` de GitHub Pages y comparten las etiquetas de la portada. Para tarjetas
distintas por ruta haría falta generar un HTML estático por ruta con sus propios
`og:title`, `og:description` y `og:url`.
