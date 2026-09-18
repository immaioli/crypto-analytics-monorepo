import { buildCodeKnowledgeGraph } from './code-knowledge-graph.mjs';
import { getRelevantContext } from './code-knowledge-graph-retrieval.mjs';

function buildAiContext(query) {
  const graph = buildCodeKnowledgeGraph(process.cwd());
  const context = getRelevantContext(graph, query);

  return {
    query,
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

function main() {
  const queries = [
    'CryptoService fallback cache',
    'TopCoins hook API flow',
    'CryptoModule provider registration',
  ];

  for (const query of queries) {
    const result = buildAiContext(query);
    console.log(`\n=== AI CONTEXT FOR: ${query} ===`);
    console.log(JSON.stringify(result, null, 2));
  }
}

if (process.argv[1] && process.argv[1].toLowerCase().endsWith('code-knowledge-graph-ai.mjs')) {
  main();
}

export { buildAiContext };
