/**
 * Verificación post-build: cada .ts de src/ debe tener su .js en app/,
 * y web/ debe contener las páginas SEO, sitemap, robots y assets.
 * Post-build check: every src/ .ts must have its .js in app/,
 * and web/ must contain the SEO pages, sitemap, robots and assets.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const APP = path.join(ROOT, "app");
const WEB = path.join(ROOT, "web");

/**
 * Recoge rutas relativas con cierta extensión bajo un directorio.
 * Collects relative paths with an extension under a directory.
 */
function collect(dir, ext, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, ext, base, out);
    else if (entry.name.endsWith(ext)) out.push(path.relative(base, full));
  }
  return out;
}

const missing = [];
for (const rel of collect(SRC, ".ts")) {
  const js = rel.replace(/\.ts$/, ".js");
  if (!fs.existsSync(path.join(APP, js))) missing.push(js);
}

const bundle = [
  "index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "es/index.html",
  "es/experiencia/index.html",
  "pt-BR/index.html",
  "es-cat/index.html",
  path.join("app", "index.js"),
];
for (const rel of bundle) {
  if (!fs.existsSync(path.join(WEB, rel))) missing.push(`web/${rel}`);
}

if (fs.existsSync(path.join(ROOT, "assets")) && !fs.existsSync(path.join(WEB, "assets"))) {
  missing.push("web/assets");
}

const sitemapPath = path.join(WEB, "sitemap.xml");
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) missing.push("web/sitemap.xml sin URLs");
  for (const loc of locs) {
    const pathname = new URL(loc).pathname;
    const rel = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    if (!fs.existsSync(path.join(WEB, rel.replace(/^\//, "")))) missing.push(`web/${rel.replace(/^\//, "")}`);
  }
}

const page404 = path.join(WEB, "404.html");
if (fs.existsSync(page404) && !fs.readFileSync(page404, "utf8").includes('content="noindex')) {
  missing.push("web/404.html sin noindex");
}

const esHome = path.join(WEB, "es", "index.html");
if (fs.existsSync(esHome)) {
  const html = fs.readFileSync(esHome, "utf8");
  if (!html.includes('hreflang="pt-PT"')) missing.push("web/es/index.html sin hreflang pt-PT");
  if (!html.includes('rel="canonical" href="https://gacarbla.es/es/"')) {
    missing.push("web/es/index.html sin canonical propio");
  }
}

const robotsPath = path.join(WEB, "robots.txt");
if (fs.existsSync(robotsPath) && !fs.readFileSync(robotsPath, "utf8").includes("Sitemap:")) {
  missing.push("web/robots.txt sin Sitemap");
}

if (missing.length > 0) {
  console.error(`Build incompleto / Incomplete build: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("build ok: salidas completas / outputs complete");
