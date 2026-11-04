/**
 * Empaqueta la web estática lista para servir en web/:
 * una página HTML por idioma/ruta con su head SEO, 404 real, robots,
 * sitemap, app/ y assets/.
 * Packages the ready-to-serve static site into web/:
 * one HTML per language/route with its SEO head, real 404, robots,
 * sitemap, app/ and assets/.
 */
const fs = require("fs");
const path = require("path");
const { buildSeo } = require("./seo-data.js");

const ROOT = path.join(__dirname, "..");
const WEB = path.join(ROOT, "web");
const TEMPLATE = path.join(ROOT, "index.html");

/**
 * Limpia y asegura un directorio. / Cleans and ensures a directory.
 */
function limpiar(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

limpiar(WEB);

const template = fs.readFileSync(TEMPLATE, "utf8");
const { pages, sitemap, robots } = buildSeo(template);

for (const page of pages) {
  const file = path.join(WEB, page.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page.html, "utf8");
}

fs.writeFileSync(path.join(WEB, "robots.txt"), robots, "utf8");
fs.writeFileSync(path.join(WEB, "sitemap.xml"), sitemap, "utf8");
fs.cpSync(path.join(ROOT, "app"), path.join(WEB, "app"), { recursive: true });
if (fs.existsSync(path.join(ROOT, "assets"))) {
  fs.cpSync(path.join(ROOT, "assets"), path.join(WEB, "assets"), { recursive: true });
}

console.log(`web ok: ${pages.length} páginas, sitemap y robots / ${pages.length} pages, sitemap and robots`);
