import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'playwright-report', 'test-results']);
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.md']);

function normalizePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function getNodeKind(filePath) {
  if (filePath.endsWith('.md')) return 'document';
  if (filePath.includes('/apps/api/')) return 'api-file';
  if (filePath.includes('/apps/web/')) return 'web-file';
  if (filePath.includes('/packages/')) return 'package-file';
  return 'file';
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function extractImports(fileContent) {
  const matches = [...fileContent.matchAll(/from\s+['"]([^'"]+)['"];?|import\s+['"]([^'"]+)['"];?/g)];
  return matches
    .map((match) => match[1] || match[2])
    .filter(Boolean)
    .filter((value) => !value.startsWith('.') && !value.startsWith('/'));
}

function extractRelativeImports(fileContent) {
  const matches = [...fileContent.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"];?|import\s+['"](\.\.?\/[^'"]+)['"];?/g)];
  return matches.map((match) => match[1] || match[2]).filter(Boolean);
}

function extractSymbolInfo(fileContent, relativePath) {
  const symbols = [];
  const classMatches = [...fileContent.matchAll(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g)];
  for (const match of classMatches) {
    const className = match[1];
    const classId = `symbol:${relativePath}::${className}`;
    symbols.push({
      id: classId,
      type: 'class',
      name: className,
      kind: 'class',
      file: relativePath,
      summary: `Class ${className} declared in ${relativePath}`,
    });
  }

  const moduleMatches = [...fileContent.matchAll(/@Module\s*\(([^)]*)\)|@Module\s*\{/g)];
  for (const match of moduleMatches) {
    const parentClass = [...fileContent.matchAll(/export\s+class\s+(\w+)/g)][0]?.[1];
    if (!parentClass) continue;
    const moduleId = `symbol:${relativePath}::${parentClass}`;
    symbols.push({
      id: moduleId,
      type: 'module',
      name: parentClass,
      kind: 'module',
      file: relativePath,
      summary: `Nest module ${parentClass}`,
    });
  }

  const functionMatches = [...fileContent.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\s*\(/g)];
  for (const match of functionMatches) {
    const functionName = match[1];
    const functionId = `symbol:${relativePath}::${functionName}`;
    symbols.push({
      id: functionId,
      type: 'function',
      name: functionName,
      kind: 'function',
      file: relativePath,
      summary: `Function ${functionName} declared in ${relativePath}`,
    });
  }

  const complexMatches = [...fileContent.matchAll(/(?:class\s+(\w+)|(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*(?::\s*[^\{]+)?\s*\{)/g)];
  let currentClass = null;

  for (const match of complexMatches) {
    const className = match[1];
    const methodName = match[2];

    if (className) {
      currentClass = className;
      continue;
    }

    if (!currentClass) continue;

    if (!['if', 'for', 'while', 'switch', 'catch', 'return', 'const', 'let', 'var', 'constructor'].includes(methodName)) {
      const methodId = `symbol:${relativePath}::${currentClass}.${methodName}`;
      symbols.push({
        id: methodId,
        type: 'method',
        name: `${currentClass}.${methodName}`,
        kind: 'method',
        file: relativePath,
        summary: `Method ${currentClass}.${methodName}`,
      });
    }
  }

  return symbols;
}

function buildCodeKnowledgeGraph(rootPath) {
  const root = path.resolve(rootPath);
  const nodes = [];
  const edges = [];
  const seenNodes = new Set();

  const repoId = 'repo:dashboard-cripto';
  nodes.push({
    id: repoId,
    type: 'repository',
    name: 'dashboard-cripto',
    path: '.',
    summary: 'Monorepo for the crypto dashboard with api, web and shared types.',
  });

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.github') continue;
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
        continue;
      }

      const ext = path.extname(entry.name);
      if (!CODE_EXTENSIONS.has(ext)) continue;

      const filePath = path.join(dir, entry.name);
      const relativePath = normalizePath(root, filePath);
      const nodeId = `file:${relativePath}`;

      if (!seenNodes.has(nodeId)) {
        seenNodes.add(nodeId);
        nodes.push({
          id: nodeId,
          type: getNodeKind(relativePath),
          name: entry.name,
          path: relativePath,
          summary: `Code artifact for ${relativePath}`,
        });
      }

      edges.push({
        from: repoId,
        to: nodeId,
        type: 'CONTAINS',
      });

      const content = safeRead(filePath);
      const imports = extractImports(content);
      const relativeImports = extractRelativeImports(content);
      const symbols = extractSymbolInfo(content, relativePath);

      for (const symbol of symbols) {
        if (!seenNodes.has(symbol.id)) {
          seenNodes.add(symbol.id);
          nodes.push(symbol);
        }
        edges.push({
          from: nodeId,
          to: symbol.id,
          type: 'CONTAINS',
        });
      }

      for (const imported of imports) {
        const importNodeId = `pkg:${imported}`;
        if (!seenNodes.has(importNodeId)) {
          seenNodes.add(importNodeId);
          nodes.push({
            id: importNodeId,
            type: 'dependency-package',
            name: imported,
            path: imported,
            summary: `External package dependency: ${imported}`,
          });
        }

        edges.push({
          from: nodeId,
          to: importNodeId,
          type: 'IMPORTS',
        });
      }

      for (const imported of relativeImports) {
        const resolved = path.resolve(path.dirname(filePath), imported);
        const candidate = resolveRelativeCandidate(root, resolved);
        if (candidate) {
          const toId = `file:${candidate}`;
          edges.push({
            from: nodeId,
            to: toId,
            type: 'IMPORTS',
            detail: imported,
          });
        }
      }
    }
  }

  walk(root);

  return { nodes, edges };
}

function resolveRelativeCandidate(root, absolutePath) {
  const candidates = [
    absolutePath,
    `${absolutePath}.ts`,
    `${absolutePath}.tsx`,
    `${absolutePath}.js`,
    `${absolutePath}.jsx`,
    `${absolutePath}/index.ts`,
    `${absolutePath}/index.tsx`,
    `${absolutePath}/index.js`,
    `${absolutePath}/index.jsx`,
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return normalizePath(root, candidate);
    }
  }

  return null;
}

export {
  buildCodeKnowledgeGraph,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const graph = buildCodeKnowledgeGraph(process.cwd());
  const output = {
    nodes: graph.nodes.slice(0, 100),
    edges: graph.edges.slice(0, 200),
    stats: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
    },
  };

  console.log(JSON.stringify(output, null, 2));
}
