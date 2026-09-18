import neo4j from 'neo4j-driver';
import { buildCodeKnowledgeGraph } from './code-knowledge-graph.mjs';

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'dashboard-cripto';

function getDriver() {
  return neo4j.driver(uri, neo4j.auth.basic(user, password));
}

async function pushGraph(driver, graph) {
  const session = driver.session();

  try {
    await session.executeWrite(async (transaction) => {
      await transaction.run('CREATE CONSTRAINT code_node_id IF NOT EXISTS FOR (node:CodeNode) REQUIRE node.id IS UNIQUE');
      await transaction.run('CREATE INDEX code_node_type IF NOT EXISTS FOR (node:CodeNode) ON (node.type)');
      await transaction.run('MATCH (node:CodeNode) DETACH DELETE node');

      await transaction.run(
        `UNWIND $nodes AS item
         CREATE (node:CodeNode)
         SET node = item`,
        { nodes: graph.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          name: node.name || null,
          path: node.path || null,
          summary: node.summary || null,
        })) },
      );

      await transaction.run(
        `UNWIND $edges AS item
         MATCH (from:CodeNode {id: item.from})
         MATCH (to:CodeNode {id: item.to})
         CREATE (from)-[edge:CODE_RELATION {type: item.type, detail: item.detail}]->(to)`,
        { edges: graph.edges.map((edge) => ({
          from: edge.from,
          to: edge.to,
          type: edge.type,
          detail: edge.detail || null,
        })) },
      );
    });
  } finally {
    await session.close();
  }
}

async function main() {
  const graph = buildCodeKnowledgeGraph(process.cwd());
  const driver = getDriver();

  try {
    await driver.verifyConnectivity();
    await pushGraph(driver, graph);
    console.log(`Persisted ${graph.nodes.length} nodes and ${graph.edges.length} edges to ${uri}.`);
  } finally {
    await driver.close();
  }
}

if (process.argv[1]?.toLowerCase().endsWith('code-knowledge-graph-neo4j.mjs')) {
  main().catch((error) => {
    console.error(`Neo4j graph push failed: ${error.message}`);
    process.exitCode = 1;
  });
}

export { getDriver, pushGraph };
