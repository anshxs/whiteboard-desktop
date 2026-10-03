const { createServer } = require("node:http");
const { readFile, stat } = require("node:fs/promises");
const path = require("node:path");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function startStaticServer({ root, host = "127.0.0.1", port = 0 }) {
  const staticRoot = path.resolve(root);
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, `http://${host}`).pathname,
      );
      const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      let filePath = path.resolve(staticRoot, relativePath);
      if (!filePath.startsWith(`${staticRoot}${path.sep}`) && filePath !== path.join(staticRoot, "index.html")) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      try {
        if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html");
      } catch {
        if (!path.extname(filePath)) filePath = path.join(filePath, "index.html");
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
        "x-content-type-options": "nosniff",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not start the Whiteboard static server."));
        return;
      }
      resolve({ server, url: `http://${host}:${address.port}` });
    });
  });
}

module.exports = { startStaticServer };
