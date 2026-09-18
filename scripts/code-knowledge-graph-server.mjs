import http from 'node:http';
import { buildGraphContext } from './code-knowledge-graph-service.mjs';

const port = Number(process.env.GRAPH_CONTEXT_PORT || 3005);

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const query = url.searchParams.get('query') || 'CryptoService fallback cache';

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }, null, 2));
    return;
  }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'code-knowledge-graph-server' }, null, 2));
    return;
  }

  if (url.pathname === '/graph-context') {
    try {
      const context = buildGraphContext(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(context, null, 2));
      return;
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Unknown error' }, null, 2));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', available: ['/health', '/graph-context?query=...'] }, null, 2));
});

server.listen(port, () => {
  console.log(`Code Knowledge Graph server is running on http://localhost:${port}`);
  console.log('Try: http://localhost:3005/graph-context?query=CryptoService%20fallback%20cache');
});
