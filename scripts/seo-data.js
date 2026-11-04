/**
 * Datos y render SEO por idioma/ruta. Lee los diccionarios de src/lang/*.ts
 * (objetos JS válidos tras quitar `export const` y `as const`) y genera el
 * HTML estático de cada página, su JSON-LD, sitemap y robots.
 * SEO data and rendering per language/route. Reads src/lang/*.ts dictionaries
 * (valid JS objects once `export const` and `as const` are stripped) and
 * generates each page's static HTML, JSON-LD, sitemap and robots.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ORIGIN = "https://gacarbla.es";

/**
 * Carga un diccionario TS/JS sin compilar. / Loads a TS/JS dictionary.
 * @param {string} name - Archivo sin extensión. / File without extension.
 * @returns {Record<string, string>} Diccionario. / Dictionary.
 */
function loadDict(name) {
  const src = fs.readFileSync(path.join(ROOT, "src", "lang", `${name}.ts`), "utf8");
  const js = src
    .replace(/export const \w+\s*=\s*/, "module.exports = ")
    .replace(/\}\s*as const;?\s*$/, "};");
  const mod = { exports: {} };
  new Function("module", "exports", js)(mod, mod.exports);
  return mod.exports;
}

/** Escapa texto para HTML y atributos. / Escapes text for HTML and attributes. */
function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Idiomas reales indexables. / Real indexable languages. */
const LOCALES = [
  { code: "es", htmlLang: "es", hreflang: "es", og: "es_ES", short: "ES", dict: loadDict("es") },
  { code: "en", htmlLang: "en", hreflang: "en", og: "en_GB", short: "EN", dict: loadDict("en") },
  { code: "gl", htmlLang: "gl", hreflang: "gl", og: "gl_ES", short: "GL", dict: loadDict("gl") },
  { code: "pt", htmlLang: "pt-PT", hreflang: "pt-PT", og: "pt_PT", short: "PT", dict: loadDict("pt") },
  { code: "pt-BR", htmlLang: "pt-BR", hreflang: "pt-BR", og: "pt_BR", short: "BR", dict: loadDict("pt-br") },
  { code: "fr", htmlLang: "fr", hreflang: "fr", og: "fr_FR", short: "FR", dict: loadDict("fr") },
  { code: "it", htmlLang: "it", hreflang: "it", og: "it_IT", short: "IT", dict: loadDict("it") },
];

/** Idiomas gatuno, accesibles pero fuera de sitemap/hreflang. / Cat languages, outside sitemap/hreflang. */
const CAT_LOCALES = [
  { code: "es-cat", htmlLang: "es", hreflang: "es", og: "es_ES", short: "MIAU", dict: loadDict("es-cat") },
  { code: "en-cat", htmlLang: "en", hreflang: "en", og: "en_GB", short: "MEOW", dict: loadDict("en-cat") },
];

/** Rutas públicas. / Public routes. */
const ROUTES = [
  { name: "inicio", slug: "", h1: "GACARBLA", titleKey: "inicio.rol", descKey: "inicio.texto", type: "ProfilePage" },
  { name: "experiencia", slug: "experiencia", h1Key: "experiencia.titulo", descKey: "experiencia.texto", type: "AboutPage" },
  { name: "contacto", slug: "contacto", h1Key: "contacto.titulo", descKey: "contacto.texto", type: "ContactPage" },
];

const ROUTE_BY_NAME = new Map(ROUTES.map((r) => [r.name, r]));

/** Path canónico con barra final. / Canonical path with trailing slash. */
function pagePath(locale, route) {
  return route.slug ? `/${locale.code}/${route.slug}/` : `/${locale.code}/`;
}

/** URL absoluta canónica. / Absolute canonical URL. */
function pageUrl(locale, route) {
  return `${ORIGIN}${pagePath(locale, route)}`;
}

/** Ruta de archivo dentro de web/. / File path inside web/. */
function pageFile(locale, route) {
  return route.slug ? `${locale.code}/${route.slug}/index.html` : `${locale.code}/index.html`;
}

/** Título y descripción de una ruta. / Route title and description. */
function pageCopy(locale, route) {
  const d = locale.dict;
  if (route.name === "inicio") {
    return {
      h1: "GACARBLA",
      title: `GACARBLA — ${d["inicio.rol"]}`,
      description: d["inicio.texto"],
    };
  }
  const h1 = d[route.h1Key];
  return {
    h1,
    title: `${h1} — GACARBLA`,
    description: d[route.descKey],
  };
}

/** Enlaces hreflang del bloque head. / Head hreflang links. */
function hreflangLinks(route) {
  const links = LOCALES.map(
    (locale) => `<link rel="alternate" hreflang="${locale.hreflang}" href="${pageUrl(locale, route)}">`,
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(LOCALES[0], route)}">`);
  return links;
}

/** Alternates Open Graph. / Open Graph alternates. */
function ogAlternates(locale) {
  return LOCALES.filter((l) => l.code !== locale.code)
    .map((l) => `<meta property="og:locale:alternate" content="${l.og}">`)
    .join("\n");
}

/** Enlace interno con data-go. / Internal link with data-go. */
function link(locale, route, label, go, cls = "") {
  const classAttr = cls ? ` class="${cls}"` : "";
  return `<a${classAttr} href="${pagePath(locale, route)}" data-go="${go}">${esc(label)}</a>`;
}

/** Navegación estática crawleable. / Crawlable static nav. */
function staticNav(locale) {
  const d = locale.dict;
  const home = pagePath(locale, ROUTE_BY_NAME.get("inicio"));
  return `<nav>
  <a class="brand" href="${home}" data-go="inicio">GACARBLA</a>
  <button id="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="${esc(d["nav.menu"])}"><span></span><span></span><span></span></button>
  <div class="links" id="menu">
    <a href="${home}" data-go="inicio">${esc(d["nav.inicio"])}</a>
    <a href="${pagePath(locale, ROUTE_BY_NAME.get("experiencia"))}" data-go="experiencia">${esc(d["nav.experiencia"])}</a>
    <a href="${pagePath(locale, ROUTE_BY_NAME.get("contacto"))}" data-go="contacto">${esc(d["nav.contacto"])}</a>
  </div>
</nav>`;
}

/** Pie estático crawleable. / Crawlable static footer. */
function staticFooter(locale) {
  const d = locale.dict;
  return `<footer>
  <nav aria-label="${esc(d["nav.menu"])}">
    <a href="${pagePath(locale, ROUTE_BY_NAME.get("experiencia"))}" data-go="experiencia">${esc(d["nav.experiencia"])}</a>
    <a href="${pagePath(locale, ROUTE_BY_NAME.get("contacto"))}" data-go="contacto">${esc(d["nav.contacto"])}</a>
    <a href="https://github.com/gacarbla" rel="me">GitHub</a>
  </nav>
  <small>© <span>GACARBLA</span> — <span>2026</span></small>
</footer>`;
}

/** Enlaces de idioma estáticos (solo idiomas reales). / Static language links (real languages only). */
function staticLangs(locale, route) {
  const d = locale.dict;
  const links = LOCALES.map(
    (l) =>
      `<a href="${pagePath(l, route)}" hreflang="${l.hreflang}" lang="${l.htmlLang}">${l.short}</a>`,
  ).join("");
  return `<nav class="langs" aria-label="${esc(d["lang.etiqueta"])}">${links}</nav>`;
}

/** Contenido estático por ruta. / Static content per route. */
function staticMain(locale, route, kind) {
  const d = locale.dict;

  if (kind === "404") {
    return `<section class="hero">
  <p class="eyebrow">404</p>
  <h1>Página no encontrada</h1>
  <p class="lede">La página que buscas no existe o se ha movido.</p>
  <p>${link(locale, ROUTE_BY_NAME.get("inicio"), "Volver al inicio", "inicio", "btn")}</p>
</section>`;
  }

  if (route.name === "inicio") {
    return `<section class="hero">
  <p class="eyebrow">${esc(d["inicio.eyebrow"])}</p>
  <h1>GACARBLA</h1>
</section>`;
  }

  if (route.name === "experiencia") {
    return `<section class="hero">
  <p class="eyebrow">${esc(d["experiencia.eyebrow"])}</p>
  <h1>${esc(d["experiencia.titulo"])}</h1>
  <p class="lede">${esc(d["experiencia.texto"])}</p>
</section>
<div class="cards">
  <article><h3>${esc(d["experiencia.c1_titulo"])}</h3><p>${esc(d["experiencia.c1_texto"])}</p></article>
  <article><h3>${esc(d["experiencia.c2_titulo"])}</h3><p>${esc(d["experiencia.c2_texto"])}</p></article>
  <article><h3>${esc(d["experiencia.c3_titulo"])}</h3><p>${esc(d["experiencia.c3_texto"])}</p></article>
</div>
<p>${link(locale, ROUTE_BY_NAME.get("contacto"), d["contacto.titulo"], "contacto", "btn")}</p>`;
  }

  if (route.name === "contacto") {
    return `<section class="hero">
  <p class="eyebrow">${esc(d["contacto.eyebrow"])}</p>
  <h1>${esc(d["contacto.titulo"])}</h1>
  <p class="lede">${esc(d["contacto.texto"])}</p>
  <p><a class="btn" href="mailto:gacarbla@gacarbla.es">gacarbla@gacarbla.es</a></p>
</section>`;
  }

  return "";
}

/** JSON-LD de la página. / Page JSON-LD. */
function jsonLd(locale, route, kind, url, title, description) {
  if (kind === "404") return "";
  const d = locale.dict;
  const h1 = route.name === "inicio" ? "GACARBLA" : d[route.h1Key];
  const personId = `${ORIGIN}/#person`;
  const websiteId = `${ORIGIN}/#website`;
  const imageId = `${ORIGIN}/#ogimage`;
  const person = {
    "@type": "Person",
    "@id": personId,
    name: "Gabriel",
    alternateName: "GACARBLA",
    url: `${ORIGIN}/es/`,
    image: `${ORIGIN}/assets/gacarbla.png`,
    jobTitle: d["inicio.rol"],
    email: "gacarbla@gacarbla.es",
    sameAs: ["https://github.com/gacarbla"],
    knowsAbout: ["TypeScript", "HTML", "CSS", "React", "Python", "Rust", "REST APIs", "desarrollo web"],
    address: { "@type": "PostalAddress", addressCountry: "ES" },
  };
  const website = {
    "@type": "WebSite",
    "@id": websiteId,
    url: `${ORIGIN}/`,
    name: "GACARBLA",
    inLanguage: "es",
    publisher: { "@id": personId },
  };
  const image = {
    "@type": "ImageObject",
    "@id": imageId,
    url: `${ORIGIN}/assets/og.png?v=4`,
    width: 1200,
    height: 630,
    caption: title,
  };
  const page = {
    "@type": route.type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": websiteId },
    inLanguage: locale.htmlLang,
    primaryImageOfPage: { "@id": imageId },
  };
  page.mainEntity = { "@id": personId };

  const graph = [person, website, image, page];

  if (route.name !== "inicio") {
    const items = [
      {
        "@type": "ListItem",
        position: 1,
        name: d["nav.inicio"],
        item: `${ORIGIN}/${locale.code}/`,
      },
    ];
    items.push({ "@type": "ListItem", position: 2, name: h1, item: url });
    graph.push({ "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: items });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}

/** Construye una página completa. / Builds one full page. */
function buildPage(template, locale, route, kind) {
  const copy = pageCopy(locale, route);
  const canonical = kind === "404" ? null : pageUrl(locale, route);
  const ogUrl = kind === "root" ? `${ORIGIN}/` : canonical || `${ORIGIN}/`;
  const title = kind === "404" ? "Página no encontrada — GACARBLA" : copy.title;
  const description =
    kind === "404" ? "La página que buscas no existe o se ha movido." : copy.description;
  const robots =
    kind === "404"
      ? "noindex,nofollow"
      : kind === "cat"
        ? "noindex,follow"
        : kind === "root"
          ? "noindex,follow"
          : "index,follow,max-image-preview:large";
  const alternates = kind === "cat" || kind === "404" ? "" : ogAlternates(locale);
  const hreflangs = kind === "cat" || kind === "404" ? [] : hreflangLinks(route);
  const structured = jsonLd(locale, route, kind, canonical || ogUrl, title, description);

  let html = template;
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${locale.htmlLang}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${esc(description)}">`,
  );
  if (canonical) {
    html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`);
  } else {
    html = html.replace(/\s*<link rel="canonical" href="[^"]*">/, "");
  }
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${esc(title)}">`,
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${esc(description)}">`,
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${ogUrl}">`,
  );
  html = html.replace(
    /<meta property="og:locale" content="[^"]*">/,
    `<meta property="og:locale" content="${locale.og}">`,
  );
  html = html.replace(/\s*<meta property="og:locale:alternate" content="[^"]*">/g, "");
  if (alternates) {
    html = html.replace(
      /(<meta property="og:locale" content="[^"]*">)/,
      `$1\n${alternates}`,
    );
  }
  html = html.replace(
    /<meta property="og:image:alt" content="[^"]*">/,
    `<meta property="og:image:alt" content="${esc(title)}">`,
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${esc(title)}">`,
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${esc(description)}">`,
  );
  html = html.replace(
    /<meta name="twitter:image:alt" content="[^"]*">/,
    `<meta name="twitter:image:alt" content="${esc(title)}">`,
  );

  const extras = [
    `<meta name="robots" content="${robots}">`,
    ...hreflangs,
    structured ? `<script type="application/ld+json">${structured}</script>` : "",
  ].filter(Boolean);
  html = html.replace("</head>", () => `${extras.join("\n")}\n</head>`);

  const nav = staticNav(locale);
  const footer = staticFooter(locale);
  const langs = staticLangs(locale, route);
  const main = staticMain(locale, route, kind);
  const body = `<body>
<app><div class="rtw-view">
${nav}
<main id="contenido">
${main}
</main>
${footer}
${langs}
</div></app>
<script type="module" src="/app/index.js"></script>
</body>`;
  html = html.replace(/<body>[\s\S]*?<\/body>/, () => body);

  const file = kind === "root" ? "index.html" : kind === "404" ? "404.html" : pageFile(locale, route);
  return { file, html, title, description, canonical, robots };
}

/** Genera todas las páginas + sitemap + robots. / Builds all pages + sitemap + robots. */
function buildSeo(template) {
  const pages = [];
  pages.push(buildPage(template, LOCALES[0], ROUTES[0], "root"));
  pages.push(buildPage(template, LOCALES[0], ROUTES[0], "404"));
  for (const locale of LOCALES) {
    for (const route of ROUTES) pages.push(buildPage(template, locale, route, "public"));
  }
  for (const locale of CAT_LOCALES) {
    for (const route of ROUTES) pages.push(buildPage(template, locale, route, "cat"));
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      urls.push(`  <url><loc>${pageUrl(locale, route)}</loc><lastmod>${today}</lastmod></url>`);
    }
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  const robots = `User-agent: *
Allow: /
Disallow: /*jardin
Disallow: /*linde
Disallow: /*cauce
Disallow: /*games
Disallow: /*umbra
Disallow: /*relicario
Disallow: /es-cat
Disallow: /en-cat
Sitemap: ${ORIGIN}/sitemap.xml
`;
  return { pages, sitemap, robots };
}

module.exports = { LOCALES, CAT_LOCALES, ROUTES, pagePath, pageUrl, pageFile, buildSeo, esc };
