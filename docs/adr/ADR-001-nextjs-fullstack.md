# ADR-001: Next.js 16 as Full-Stack Framework

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Apaz  

## Context

The project requires a web interface for uploading and managing videos with user authentication, metadata editing, search, and video playback. The stack needs to serve both the frontend UI and the backend API from a single codebase for development simplicity.

## Decision

Use **Next.js 16** (App Router) as the full-stack framework. The frontend is React with TypeScript; the backend is Next.js API Routes.

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Next.js 16 (chosen)** | Single codebase, server components, file-based routing, built-in TypeScript | Build complexity with standalone output |
| Express.js + React SPA | Maximum flexibility, proven | Two separate codebases, deployment complexity |
| NestJS + Next.js | Structured backend with DI | Two frameworks to maintain |
| Remix | Excellent data loading patterns | Smaller ecosystem, less tooling |

## Consequences

**Positive:**
- Single `npm install && npm run dev` to start the full application.
- API Routes are co-located with the frontend, simplifying the development workflow.
- Built-in TypeScript support without additional configuration.
- `output: 'standalone'` produces a minimal Docker image suitable for production.

**Negative:**
- Next.js opinionated routing; adding complex backend logic (queues, workers) requires workarounds.
- Turbopack (used in dev) has occasional incompatibilities with some libraries.

**Risks:**
- Next.js 16 is recent; some ecosystem libraries may not yet be compatible.
