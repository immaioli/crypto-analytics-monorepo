import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function mustExist(relativePath) {
  assert.ok(existsSync(join(root, relativePath)), `missing ${relativePath}`);
}

const requiredFiles = [
  "package.json",
  "docker-compose.yml",
  ".env.example",
  ".gitignore",
  ".dockerignore",
  "packages/shared-types/src/index.ts",
  "packages/shared-types/package.json",
  "apps/api/Dockerfile",
  "apps/api/src/main.js",
  "apps/web/Dockerfile",
  "apps/web/server.js",
];

for (const file of requiredFiles) {
  mustExist(file);
}

const gitignore = read(".gitignore");
assert.match(gitignore, /\.env/, ".gitignore must ignore .env files");
assert.match(gitignore, /node_modules/, ".gitignore must ignore node_modules");
assert.doesNotMatch(
  gitignore,
  /^\.env\.example$/m,
  ".env.example must remain commitable",
);

const envExample = read(".env.example");
for (const key of [
  "COINGECKO_API_KEY",
  "REDIS_HOST",
  "REDIS_PORT",
  "NEXT_PUBLIC_API_URL",
  "PORT",
]) {
  assert.match(envExample, new RegExp(`^${key}=`, "m"), `.env.example missing ${key}`);
}

const compose = read("docker-compose.yml");
assert.match(compose, /image:\s*redis:7-alpine/, "compose must pin redis:7-alpine");
assert.match(compose, /dockerfile:\s*apps\/api\/Dockerfile/, "compose must build the API");
assert.match(compose, /dockerfile:\s*apps\/web\/Dockerfile/, "compose must build the web app");
assert.match(compose, /6379:6379/, "compose must publish Redis");
assert.match(compose, /3001:3001/, "compose must publish the API");
assert.match(compose, /3000:3000/, "compose must publish the web app");
assert.match(compose, /healthcheck:/, "Redis must declare a healthcheck");
assert.match(compose, /depends_on:[\s\S]*redis:/, "API must wait on Redis");

const rootPkg = JSON.parse(read("package.json"));
assert.deepEqual(rootPkg.workspaces, ["apps/*", "packages/*"]);

const types = read("packages/shared-types/src/index.ts");
for (const token of [
  "export interface CoinSummary",
  "export type OhlcCandle",
  "export interface CoinHistory",
  "export interface CompareResponse",
  "export const API_ROUTES",
]) {
  assert.match(types, new RegExp(token), `shared-types missing ${token}`);
}

console.log("infra validation passed");
