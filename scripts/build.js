/**
 * Construye el sitio en web/: copia la página y sus recursos, y genera
 * robots.txt, sitemap.xml, CNAME y .nojekyll. Sin dependencias.
 * Builds the site into web/: copies the page and its assets, and writes
 * robots.txt, sitemap.xml, CNAME and .nojekyll. No dependencies.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "web");
const ORIGIN = "https://gacarbla.es";

const PAGINAS = ["index.html", "404.html"];
const CARPETAS = ["css", "js", "assets"];
const RECURSOS = /["'(](\/[^"'()\s]+\.(?:css|js|woff2|png|jpg|jpeg|svg|webp|ico))["')]/g;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const pagina of PAGINAS) {
  fs.copyFileSync(path.join(ROOT, pagina), path.join(OUT, pagina));
}
for (const carpeta of CARPETAS) {
  fs.cpSync(path.join(ROOT, carpeta), path.join(OUT, carpeta), { recursive: true });
}

const hoy = new Date().toISOString().slice(0, 10);

fs.writeFileSync(
  path.join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  "utf8",
);

fs.writeFileSync(
  path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${ORIGIN}/</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
  "utf8",
);

fs.writeFileSync(path.join(OUT, "CNAME"), "gacarbla.es\n", "utf8");
fs.writeFileSync(path.join(OUT, ".nojekyll"), "", "utf8");

/** Rutas locales referenciadas por un fichero de texto. */
function referencias(fichero) {
  const texto = fs.readFileSync(fichero, "utf8");
  const salida = [];
  for (const coincidencia of texto.matchAll(RECURSOS)) {
    if (!coincidencia[1].startsWith("//")) salida.push(coincidencia[1]);
  }
  return salida;
}

const faltan = [];
for (const pagina of PAGINAS) {
  for (const ruta of referencias(path.join(OUT, pagina))) {
    if (!fs.existsSync(path.join(OUT, ruta))) faltan.push(`${pagina} → ${ruta}`);
  }
}
for (const hoja of fs.readdirSync(path.join(OUT, "css"))) {
  for (const ruta of referencias(path.join(OUT, "css", hoja))) {
    if (!fs.existsSync(path.join(OUT, ruta))) faltan.push(`css/${hoja} → ${ruta}`);
  }
}

const portada = fs.readFileSync(path.join(OUT, "index.html"), "utf8");
if (!portada.includes(`<link rel="canonical" href="${ORIGIN}/">`)) {
  faltan.push("index.html sin canonical");
}
if (!/<title>[^<]+<\/title>/.test(portada)) faltan.push("index.html sin title");
if (!portada.includes('property="og:image"')) faltan.push("index.html sin og:image");

if (faltan.length) {
  console.error(`Build incompleto:\n  ${faltan.join("\n  ")}`);
  process.exit(1);
}

/** Tamaño total del paquete, para vigilar que siga siendo ligero. */
function peso(directorio) {
  let total = 0;
  for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
    const completo = path.join(directorio, entrada.name);
    total += entrada.isDirectory() ? peso(completo) : fs.statSync(completo).size;
  }
  return total;
}

const kb = Math.round(peso(OUT) / 1024);
console.log(`web ok: ${PAGINAS.length} páginas, ${CARPETAS.join("/ ")}, sitemap y robots · ${kb} KB`);
