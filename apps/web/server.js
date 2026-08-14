import http from "node:http";

const port = Number(process.env.PORT ?? 3000);
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Crypto Dashboard — scaffolding</title>
    <style>
      :root { color-scheme: dark; }
      body { font-family: ui-sans-serif, system-ui, sans-serif; background: #0b1220; color: #e8eefc; margin: 0; }
      main { max-width: 42rem; margin: 12vh auto; padding: 0 1.5rem; }
      h1 { font-size: 1.75rem; }
      p { color: #9bb0d3; line-height: 1.5; }
      code { color: #c9d7ff; }
    </style>
  </head>
  <body>
    <main>
      <h1>Crypto Dashboard</h1>
      <p>Phase 1 infrastructure is up. Next.js lands in Phase 3.</p>
      <p>API target: <code>${apiUrl}</code></p>
    </main>
  </body>
</html>`;

export const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "web" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, () => {
    process.stdout.write(`web listening on ${port}\n`);
  });
}
