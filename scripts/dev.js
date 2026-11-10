/**
 * Servidor estático de desarrollo, sin dependencias.
 * `npm run dev` sirve el proyecto; `npm run preview` sirve web/.
 * Dependency-free static dev server.
 */
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SERVE_WEB = process.argv.includes("--web");
const BASE = SERVE_WEB ? path.join(ROOT, "web") : ROOT;
const PORT = Number(process.env.PORT) || 8081;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

/**
 * Devuelve el fichero servible para una ruta, o null si se sale de la raíz.
 * @param {string} ruta - Ruta de la URL.
 * @returns {string | null} Ruta absoluta.
 */
function resolver(ruta) {
  const limpia = decodeURIComponent(ruta.split("?")[0]);
  const relativa = limpia.endsWith("/") ? `${limpia}index.html` : limpia;
  const completo = path.normalize(path.join(BASE, relativa));
  return completo.startsWith(BASE) ? completo : null;
}

const servidor = http.createServer((peticion, respuesta) => {
  const fichero = resolver(peticion.url || "/");

  const responder404 = () => {
    fs.readFile(path.join(BASE, "404.html"), (error, datos) => {
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
      responder404();
      return;
    }
    respuesta.writeHead(200, {
      "Content-Type": TIPOS[path.extname(fichero)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    respuesta.end(datos);
  });
});

servidor.listen(PORT, () => {
  console.log(`Sirviendo ${path.relative(ROOT, BASE) || "."} en http://localhost:${PORT}`);
});
