import { buildAiContext } from './code-knowledge-graph-ai.mjs';

function main() {
  const query = process.argv.slice(2).join(' ') || 'CryptoService fallback cache';
  const result = buildAiContext(query);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && process.argv[1].toLowerCase().endsWith('code-knowledge-graph-query.mjs')) {
  main();
}

export { main };
