import http from "node:http";
import { getHealthPayload } from "./health/health.js";

const port = Number(process.env.PORT ?? 3001);

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    const body = JSON.stringify(getHealthPayload());
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(body);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ statusCode: 404, message: "Not Found", error: "Not Found" }));
});

server.listen(port, () => {
  process.stdout.write(`api listening on ${port}\n`);
});
