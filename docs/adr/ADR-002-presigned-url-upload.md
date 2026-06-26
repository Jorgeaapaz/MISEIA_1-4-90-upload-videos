# ADR-002: Presigned URLs for Client-Side Upload

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Apaz  

## Context

Video files are large (potentially hundreds of MB). Uploading them through the Next.js server would require the server to buffer the entire binary in memory or stream it through, consuming server resources proportional to file size and concurrency.

## Decision

Use **presigned S3 PUT URLs**: the browser requests a temporary signed URL from the API (`POST /api/upload/presign`), then uploads the binary **directly to RustFS** without going through the Next.js server.

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Presigned URL direct upload (chosen)** | Zero server memory for binary data, full bandwidth to S3 | CORS config on RustFS required, split error surface |
| Server-side multipart streaming | Single upload endpoint, simpler client | All bandwidth goes through Next.js, server memory pressure |
| Chunked client-side with reassembly | Resumable uploads | Very complex implementation |

## Consequences

**Positive:**
- Next.js server memory consumption is O(1) regardless of file size or concurrency.
- Upload bandwidth goes directly from the browser to RustFS at maximum available speed.
- Aligns with how S3-compatible stores are designed to be used.

**Negative:**
- RustFS bucket must allow CORS for PUT requests from the browser origin.
- Presigned URLs expire (15 minutes); very slow uploads on poor connections may fail.
- Upload errors come from RustFS directly (not from the API), making client-side error handling slightly more complex.

**Risks:**
- If RustFS is not publicly accessible (private Docker network), the presigned URL must use a publicly routable endpoint. Solved by routing RustFS through Traefik.
