/**
 * Construcción del sitio: empaqueta la escena con esbuild y copia el
 * resto de piezas a web/. También genera robots, sitemap y CNAME, y
 * comprueba que no falte ningún recurso referenciado.
 */
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "web");
const ORIGIN = "https://gacarbla.es";

const PAGINAS = ["index.html", "404.html"];
const CARPETAS = ["css", "assets"];

const REFERENCIA = /["'(](\/[^"'()\s]+\.(?:css|js|woff2|png|jpg|jpeg|svg|webp|ico))["')]/g;

/**
 * Compila la escena y monta web/.
 * @param {{ minify?: boolean, sourcemap?: boolean }} opciones
 * @returns {Promise<{ kb: number }>}
 */
async function build({ minify = true, sourcemap = false } = {}) {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "js"), { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(ROOT, "src", "main.js")],
    bundle: true,
    format: "esm",
    target: ["es2020"],
    minify,
    sourcemap: sourcemap ? "inline" : false,
    legalComments: "none",
    outfile: path.join(OUT, "js", "app.js"),
    logLevel: "silent",
  });

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

  comprobar();
  return { kb: Math.round(peso(OUT) / 1024) };
}

/** Referencias locales de un fichero de texto. */
function referencias(fichero) {
  const texto = fs.readFileSync(fichero, "utf8");
  const salida = [];
  for (const coincidencia of texto.matchAll(REFERENCIA)) {
    if (!coincidencia[1].startsWith("//")) salida.push(coincidencia[1]);
  }
  return salida;
}

/** Falla si falta un recurso o un metadato imprescindible. */
function comprobar() {
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
  if (!portada.includes(`<link rel="canonical" href="${ORIGIN}/">`)) faltan.push("index.html sin canonical");
  if (!/<title>[^<]+<\/title>/.test(portada)) faltan.push("index.html sin title");
  if (!portada.includes('property="og:image"')) faltan.push("index.html sin og:image");
  if (!fs.existsSync(path.join(OUT, "js", "app.js"))) faltan.push("js/app.js ausente");
  if (!fs.existsSync(path.join(OUT, "assets", "og.jpg"))) faltan.push("assets/og.jpg ausente");

  if (faltan.length) {
    console.error(`Build incompleto:\n  ${faltan.join("\n  ")}`);
    process.exit(1);
  }
}

/** Peso total del paquete para vigilar que no se dispare. */
function peso(directorio) {
  let total = 0;
  for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
    const completo = path.join(directorio, entrada.name);
    total += entrada.isDirectory() ? peso(completo) : fs.statSync(completo).size;
  }
  return total;
}

module.exports = { build };

if (require.main === module) {
  build()
    .then(({ kb }) => console.log(`web ok · ${kb} KB`))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
