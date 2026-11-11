/**
 * Servidor de desarrollo: sirve web/ y recompila al vuelo cuando cambia
 * la escena, la hoja de estilos o las páginas.
 */
const fs = require("fs");
const http = require("http");
const path = require("path");
const { build } = require("./build.js");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "web");
const PORT = Number(process.env.PORT) || 8081;
const PREVIEW = process.argv.includes("--preview");
const IGNORAR = ["web", "node_modules", ".git", ".VSCodeCounter"];

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function resolver(ruta) {
  const limpia = decodeURIComponent(ruta.split("?")[0]);
  const relativa = limpia.endsWith("/") ? `${limpia}index.html` : limpia;
  const completo = path.normalize(path.join(OUT, relativa));
  return completo.startsWith(OUT) ? completo : null;
}

function servir() {
  http
    .createServer((peticion, respuesta) => {
      const fichero = resolver(peticion.url || "/");

      const noEncontrado = () => {
        fs.readFile(path.join(OUT, "404.html"), (error, datos) => {
          if (error) {
            respuesta.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            respuesta.end("404");
            return;
          }
          respuesta.writeHead(404, { "Content-Type": TIPOS[".html"], "Cache-Control": "no-store" });
          respuesta.end(datos);
        });
      };

      if (!fichero) {
        respuesta.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        respuesta.end("403");
        return;
      }

      fs.readFile(fichero, (error, datos) => {
        if (error) {
          noEncontrado();
          return;
        }
        respuesta.writeHead(200, {
          "Content-Type": TIPOS[path.extname(fichero)] || "application/octet-stream",
          "Cache-Control": "no-store",
        });
        respuesta.end(datos);
      });
    })
    .listen(PORT, () => {
      console.log(`→ http://localhost:${PORT}`);
    });
}

async function compilar(etiqueta) {
  try {
    const { kb } = await build({ minify: PREVIEW, sourcemap: !PREVIEW });
    console.log(`[${etiqueta}] web ok · ${kb} KB`);
  } catch (error) {
    console.error(`[${etiqueta}] fallo de compilación`);
    console.error(error.message || error);
  }
}

(async () => {
  await compilar("build");
  servir();

  if (PREVIEW) return;

  let pendiente = 0;
  const observar = (directorio) => {
    if (!fs.existsSync(directorio)) return;
    try {
      fs.watch(directorio, { recursive: true }, (_evento, archivo) => {
        if (!archivo) return;
        if (IGNORAR.some((parte) => archivo.split(path.sep).includes(parte))) return;
        clearTimeout(pendiente);
        pendiente = setTimeout(() => compilar("watch"), 140);
      });
    } catch (error) {
      console.warn(`No se pudo observar ${directorio}: ${error.message}`);
    }
  };

  try {
    fs.watch(ROOT, (_evento, archivo) => {
      if (!archivo) return;
      const nombre = path.basename(archivo);
      if (!["index.html", "404.html"].includes(nombre)) return;
      clearTimeout(pendiente);
      pendiente = setTimeout(() => compilar("watch"), 140);
    });
  } catch (error) {
    console.warn(`No se pudo observar la raíz: ${error.message}`);
  }

  observar(path.join(ROOT, "src"));
  observar(path.join(ROOT, "css"));
  observar(path.join(ROOT, "assets"));
})();
