# Vistas previas sociales / Social link previews

## Qué hay

- Etiquetas **Open Graph** y **Twitter Card** en `index.html`: título, descripción, URL
  canónica, imagen absoluta, dimensiones, alt, locale y locales alternativos.
- Tarjeta **1200×630** en `assets/og.png` (108 KB, por debajo del límite habitual de
  WhatsApp).
- Generador reproducible: `scripts/og-image.ps1` (PowerShell + System.Drawing).
  Usa el retrato enmarcado, la paleta y la tipografía de la web.
- `404.html` es una copia de `index.html`, así que también lleva las etiquetas.

## Cloudflare

El dominio está detrás de Cloudflare. Si el proxy está activo con un challenge
(Under Attack Mode, Bot Fight Mode o una regla de seguridad), Discord, WhatsApp,
Telegram, Twitter/X y LinkedIn reciben un **403 «Just a moment…»** y no pueden leer
las etiquetas ni la imagen.

Dos formas de arreglarlo:

1. **DNS only**: poner el registro de `gacarbla.es` en gris (sin proxy). GitHub Pages
   sirve directamente y los bots leen el HTML y la imagen.
2. **Mantener el proxy**: crear una regla WAF de tipo **Skip** para los user agents
   de los bots sociales y las rutas `/` y `/assets/*`:
   `Discordbot`, `WhatsApp`, `Twitterbot`, `facebookexternalhit`, `TelegramBot`,
   `LinkedInBot`, `Slackbot`, `Pinterest`, `redditbot`.
   Si se usa «Verified Bots», comprobar que esos bots estén permitidos. Desactivar
   Under Attack Mode / Bot Fight Mode mientras se prueba.

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
