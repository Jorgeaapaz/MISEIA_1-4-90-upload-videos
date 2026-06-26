# ADR-003: MongoDB for Flexible Video Metadata

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Apaz  

## Context

The project specification requires videos to have arbitrary key-value metadata pairs and multi-value tags. Users must be able to search across all metadata fields. The schema of these fields is not known at design time.

## Decision

Use **MongoDB** with a document model for all data (users and video metadata), including the dynamic key-value pairs as a nested object and tags as a string array.

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **MongoDB (chosen)** | Native flexible schema, array operators, text indexes | No referential integrity, no JOIN |
| PostgreSQL with JSONB | Full SQL power + flexible JSONB | Requires JSONB operators for search, `tsvector` for full-text |
| PostgreSQL with video_tags table | Clean relational model | N+M queries, rigid schema for key-value |
| Redis (metadata cache) | Fast reads | Not a primary store, no full-text search |

## Consequences

**Positive:**
- `{ metadata: { director: 'Smith', project: 'alpha' }, tags: ['2024', 'promo'] }` is natural — no schema migrations when new metadata keys are introduced.
- Native text indexes on name, description, and tags array enable full-text search with a single MongoDB query.
- `$in` operator on tags enables efficient multi-tag filtering.

**Negative:**
- No cascade deletes: deleting a user does NOT automatically delete their videos (handled in application code).
- No JOIN: getting video count per user requires `$group` aggregation, not a simple `COUNT(*) GROUP BY`.
- BSON ObjectId is less ergonomic than SQL auto-increment integers in URL paths.

**Risks:**
- Data consistency relies on application logic, not database constraints.
