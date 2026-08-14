# Project Constitution (Crypto Dashboard)

This document defines the immutable principles governing the development of this project. Every technical decision and generated code must respect these rules. In case of conflict, the constitution prevails over specifications or technical plans.

## Article I: Strict Separation of Concerns
The front-end (Next.js) is exclusively the presentation layer. The back-end (NestJS) is the brain. All complex calculations, data normalization, percentage indexing, or time-series processing MUST happen in the back-end. The front-end only consumes render-ready data.

## Article II: Cache-First Resiliency
CoinGecko has strict rate limits (100 req/min). ALL third-party API calls must mandatorily pass through a cache middleware (Redis). The project must gracefully degrade using cached data if the external API hits rate limits (returning the latest known valid data instead of throwing errors to the client).

## Article III: Test-First Imperative (TTT)
No functional code can be written before its corresponding test. The Test-to-Task (TTT) flow is mandatory. Unit tests for business logic (services) and integration tests for endpoints must be written first. If a test fails, the task does not advance.

## Article IV: End-to-End Type Safety
There will be no loose objects or responses typed as `any`. The contract between Front-end and Back-end must be strictly typed via DTOs and shared interfaces. API route changes must break the client build at compile time to ensure contract satisfaction.

## Article V: Observability Over Opacity
The code must gracefully handle loading states, empty states, and error states. There should be no silent `console.log` in the back-end; exceptions must have descriptive messages to ease debugging in case of CoinGecko API instability.
