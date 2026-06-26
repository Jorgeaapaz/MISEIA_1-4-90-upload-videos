# ADR-004: JWT Stateless Authentication

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Apaz  

## Context

The application requires user authentication for all protected routes. A mechanism to identify and authorize users on each request is needed.

## Decision

Use **JWT (HS256, 7-day expiry)** stored in the browser's `localStorage`. Each request sends the token via `Authorization: Bearer <token>`. The server validates the signature locally without any database lookup.

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **JWT stateless (chosen)** | Zero DB round-trip per auth check, stateless horizontal scaling | No revocation before expiry |
| Sessions in MongoDB | Immediate revocation possible | +1 DB query per request |
| Sessions in Redis | Fast lookup (~1ms) + immediate revocation | Requires Redis; added infra dependency |
| OAuth2 / Auth0 | Enterprise-grade, delegated auth | Overkill for a single-app project |

## Consequences

**Positive:**
- Token verification is a local CPU operation (~0.05-0.1ms) — zero database latency overhead.
- Any Next.js instance can verify any token without shared session state.
- Simple implementation with `jsonwebtoken` and `bcryptjs`.

**Negative:**
- If a JWT is issued and the user is later deleted, the token remains valid until expiry (7 days). A malicious actor who captured a token retains access for up to 7 days.
- Tokens in `localStorage` are accessible to JavaScript, creating an XSS vector. Mitigated by not storing sensitive data in the payload (only `userId`, `email`, `name`).

**Risks:**
- If `JWT_SECRET` is leaked, all tokens can be forged. Mitigated by storing the secret as an environment variable and rotating it triggers a forced re-login for all users.
