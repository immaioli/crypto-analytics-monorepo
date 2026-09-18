import { buildCodeKnowledgeGraph } from './code-knowledge-graph.mjs';
import { getRelevantContext } from './code-knowledge-graph-retrieval.mjs';

function normalizeQuery(rawQuery) {
  if (typeof rawQuery !== 'string') return 'CryptoService fallback cache';
  const query = rawQuery.trim();
  return query.length > 0 ? query : 'CryptoService fallback cache';
}

function buildGraphContext(query) {
  const normalizedQuery = normalizeQuery(query);
  const graph = buildCodeKnowledgeGraph(process.cwd());
  const context = getRelevantContext(graph, normalizedQuery);

  return {
    query: normalizedQuery,
    summary: context.summary,
    matchedNodes: context.matchedNodes,
    subgraph: {
      nodes: context.subgraph.nodes.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        path: node.path,
        summary: node.summary,
      })),
      edges: context.subgraph.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        type: edge.type,
        detail: edge.detail,
      })),
    },
  };
}

export { normalizeQuery, buildGraphContext };
