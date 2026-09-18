import { pathToFileURL } from 'node:url';
import { buildCodeKnowledgeGraph } from './code-knowledge-graph.mjs';

function getRelevantContext(graph, query) {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const aliases = {
    crypto: ['crypto', 'coin', 'market', 'price'],
    service: ['service', 'provider', 'client', 'module', 'controller'],
    cache: ['cache', 'cached', 'redis'],
    fallback: ['fallback', 'breaker', 'retry', 'provider'],
    topcoins: ['topcoins', 'top coins', 'market', 'summary'],
    hook: ['hook', 'query', 'fetch', 'usequery'],
    frontend: ['frontend', 'web', 'component', 'chart'],
  };

  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const [key, values] of Object.entries(aliases)) {
      if (values.includes(token) || token.includes(key) || key.includes(token)) {
        values.forEach((value) => expanded.add(value));
      }
    }
  }

  const nodeMatches = graph.nodes
    .map((node) => {
      const haystack = [node.name, node.path, node.type, node.summary].filter(Boolean).join(' ').toLowerCase();
      let score = [...expanded].reduce((sum, token) => sum + (haystack.includes(token) ? 2 : 0), 0);
      const directMatch = haystack.includes(query.toLowerCase());
      if (directMatch) score += 5;
      if (node.type === 'class' && node.name && node.name.toLowerCase().includes('crypto') && node.name.toLowerCase().includes('service')) score += 20;
      if (node.path && node.path.toLowerCase().endsWith('crypto.service.ts')) score += 25;
      if (node.name && node.name.toLowerCase() === 'cryptoservice') score += 30;
      return { node, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const selectedIds = new Set(
    nodeMatches
      .filter((entry) => entry.node.type === 'class' || entry.node.type === 'file' || entry.node.path?.toLowerCase().endsWith('crypto.service.ts'))
      .slice(0, 8)
      .map((entry) => entry.node.id)
  );

  if (selectedIds.size === 0) {
    const fallback = nodeMatches.slice(0, 8).map((entry) => entry.node.id);
    fallback.forEach((id) => selectedIds.add(id));
  }
  const relatedEdges = graph.edges.filter((edge) => selectedIds.has(edge.from) || selectedIds.has(edge.to));
  const relatedNodes = graph.nodes.filter((node) => selectedIds.has(node.id) || relatedEdges.some((edge) => edge.from === node.id || edge.to === node.id));

  if (nodeMatches.length === 0) {
    return {
      matchedNodes: [],
      subgraph: { nodes: [], edges: [] },
      summary: 'Nenhum nó relevante encontrado para a consulta solicitada.',
    };
  }

  const subgraph = {
    nodes: relatedNodes,
    edges: relatedEdges,
  };

  return {
    matchedNodes: nodeMatches.slice(0, 8).map(({ node, score }) => ({ id: node.id, name: node.name, type: node.type, path: node.path, score })),
    subgraph,
    summary: `Consulta: ${query}. Contexto recuperado com ${relatedNodes.length} nós e ${relatedEdges.length} arestas.`,
  };
}

function main() {
  const graph = buildCodeKnowledgeGraph(process.cwd());
  const queries = [
    'CryptoService fallback cache',
    'TopCoins hook API flow',
    'CryptoModule provider registration',
    'Frontend chart rendering',
    'market data providers',
  ];

  for (const query of queries) {
    const result = getRelevantContext(graph, query);
    console.log(`\n=== QUERY: ${query} ===`);
    console.log(JSON.stringify({
      matchedNodes: result.matchedNodes.slice(0, 8),
      summary: result.summary,
      nodeCount: result.subgraph.nodes.length,
      edgeCount: result.subgraph.edges.length,
    }, null, 2));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export { getRelevantContext };
