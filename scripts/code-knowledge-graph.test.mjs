import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCodeKnowledgeGraph } from './code-knowledge-graph.mjs';
import { getRelevantContext } from './code-knowledge-graph-retrieval.mjs';
import { buildGraphContext } from './code-knowledge-graph-service.mjs';

test('buildCodeKnowledgeGraph includes repository, file and dependency edges', async () => {
  const graph = buildCodeKnowledgeGraph(process.cwd());

  assert.ok(graph);
  assert.ok(graph.nodes.some((node) => node.id === 'repo:dashboard-cripto'));
  assert.ok(graph.nodes.some((node) => node.path === 'apps/api/src/crypto/crypto.service.ts'));
  assert.ok(graph.edges.some((edge) => edge.type === 'CONTAINS' && edge.from === 'repo:dashboard-cripto'));
  assert.ok(graph.edges.some((edge) => edge.type === 'IMPORTS' && edge.from.includes('crypto.service.ts')));
  assert.ok(graph.nodes.some((node) => node.name === 'CryptoService'));
  assert.ok(graph.nodes.some((node) => node.name === 'CryptoModule'));
  assert.ok(graph.nodes.some((node) => node.name && node.name.endsWith('getTopCoins')));
});

test('getRelevantContext finds the service context for fallback and cache queries', () => {
  const graph = buildCodeKnowledgeGraph(process.cwd());
  const result = getRelevantContext(graph, 'CryptoService fallback cache');

  assert.ok(result.subgraph.nodes.length > 0);
  assert.ok(result.matchedNodes.some((node) => node.name === 'CryptoService' || node.path === 'apps/api/src/crypto/crypto.service.ts'));
});

test('buildGraphContext exposes the production-ready graph retrieval payload', () => {
  const result = buildGraphContext('CryptoService fallback cache');

  assert.ok(result.query.includes('CryptoService'));
  assert.ok(result.summary.includes('Contexto recuperado'));
  assert.ok(Array.isArray(result.matchedNodes));
  assert.ok(Array.isArray(result.subgraph.nodes));
  assert.ok(Array.isArray(result.subgraph.edges));
});
