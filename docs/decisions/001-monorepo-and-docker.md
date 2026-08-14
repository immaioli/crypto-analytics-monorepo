# ADR 001 — Monorepo workspaces and Docker Compose

## Context
Phase 1 needed a local environment that runs the API, the web app, and Redis together, while keeping front-end and back-end as separate deployable apps.

## Alternatives considered
- **Two isolated repos:** Cleaner CI isolation, but shared types drift and reviewers cannot see the full system in one PR.
- **Turborepo / Nx:** Useful at larger scale. Extra pipeline surface for a two-app portfolio project.
- **npm workspaces + Docker Compose (chosen):** Native tooling, one lockfile, one `docker compose up`.

## Decision
Use npm workspaces (`apps/*`, `packages/*`) and a three-service Compose file (`redis`, `api`, `web`). Shared contracts live in `@dashboard-cripto/shared-types`.

## Staff-level reasoning
Infrastructure is part of the product contract. If a reviewer cannot start the system with one command, the architecture is unfinished. Sharing types at compile time is cheaper than discovering contract drift in production.

## Trade-offs
Gained: single clone, shared types, reproducible Redis. Lost: independent versioning of each app. Acceptable until the API and web have different release cadences.

## Learning
Prefer the smallest monorepo that still enforces the API contract. Add a build orchestrator only when workspace scripts become a bottleneck.
