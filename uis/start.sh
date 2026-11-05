#!/bin/sh
set -e

if [ "${1:-}" = "--local" ]; then
  cd "$(dirname "$0")/.."
  exec node --input-type=module <<'JS'
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/application.html", ["application.html", "text/html; charset=utf-8"]],
  ["/validation.js", ["validation.js", "text/javascript; charset=utf-8"]],
]);

function upstreamFor(path) {
  if (path === "/api/commercial-inquiries") return 8000;
  return null;
}

function proxyHeaders(request) {
  return {
    ...request.headers,
    "x-forwarded-host": request.headers.host,
    "x-forwarded-proto": "http",
    "x-forwarded-for": request.socket.remoteAddress,
  };
}

const server = http.createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  const port = upstreamFor(path);
  if (port) {
    const upstream = http.request({
      hostname: "127.0.0.1", port, path: request.url,
      method: request.method, headers: proxyHeaders(request),
    }, (result) => {
      response.writeHead(result.statusCode, result.headers);
      result.on("error", (error) => response.destroy(error));
      result.pipe(response);
    });
    upstream.setTimeout(30000, () => upstream.destroy(new Error("Upstream timeout")));
    upstream.on("error", (error) => {
      console.error(`Local proxy ${request.method} ${path}: ${error.message}`);
      if (!response.headersSent) {
        response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Servicio no disponible. Comprueba el backend del formulario comercial.");
      } else {
        response.destroy(error);
      }
    });
    request.on("aborted", () => upstream.destroy());
    request.pipe(upstream);
    return;
  }
  const file = publicFiles.get(path);
  if (!file || !["GET", "HEAD"].includes(request.method)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  try {
    const info = await stat(file[0]);
    response.writeHead(200, {
      "Content-Type": file[1], "Content-Length": info.size,
      "Cache-Control": "no-store",
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      const stream = createReadStream(file[0]);
      stream.on("error", (error) => {
        console.error(`Local static file: ${error.message}`);
        response.destroy(error);
      });
      stream.pipe(response);
    }
  } catch (error) {
    console.error(`Local static file: ${error.message}`);
    response.writeHead(500);
    response.end("No se pudo leer el recurso publico.");
  }
});

server.on("upgrade", (_request, socket) => {
  socket.end("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
});

server.on("error", (error) => {
  console.error(`Local public server: ${error.message}`);
  process.exitCode = 1;
});
server.listen(3000, "127.0.0.1", () => {
  console.log("Web publica: http://localhost:3000");
  console.log("El formulario requiere el backend en 8000. No sirve el backoffice. Solo desarrollo local.");
});
JS
fi

echo "Starting the unified backoffice on port 3000 at /backoffice..."
exec npm --prefix /app/backoffice run dev -- --hostname 0.0.0.0 --port 3000
