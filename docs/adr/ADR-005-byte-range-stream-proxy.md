# ADR-005: HTTP Byte-Range Proxy for Video Streaming

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Apaz  

## Context

The `<video>` HTML5 element requires HTTP byte-range responses (`206 Partial Content`) for native seeking and buffering. Video files are stored in RustFS, which is on a private Docker network. Users must only be able to access their own videos.

## Decision

Stream videos through a Next.js API route (`/api/stream/[id]`) that authenticates the request, fetches the object from RustFS server-side, and proxies it back to the browser with proper `Content-Range` and `206 Partial Content` headers.

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Byte-range proxy in Next.js (chosen)** | Authentication enforced, RustFS stays private | All bandwidth goes through app server |
| Presigned GET URL (direct from RustFS) | Zero server bandwidth, lower latency | RustFS must be publicly accessible; URL can be shared |
| CDN with signed URLs (CloudFront/CF) | Optimal performance + auth | Requires CDN integration, additional cost/complexity |
| Public bucket + auth on metadata only | Simplest implementation | Videos publicly accessible by direct URL |

## Consequences

**Positive:**
- Authentication is enforced at the stream endpoint — only the token owner can access their videos.
- RustFS remains on a private network; only Traefik and the Next.js container can access it.
- Future server-side operations (watermarking, DRM, analytics) can be inserted into the proxy without client changes.

**Negative:**
- All video bandwidth passes through the Next.js container, which is a CPU and bandwidth bottleneck.
- For many concurrent video viewers, the server could become a bottleneck. Acceptable for the current usage scope (small number of users per deployment).
- Slightly higher latency compared to direct CDN delivery (one additional network hop).

**Risks:**
- For production scale with many concurrent viewers, this pattern does not scale. The correct evolution would be to add CloudFront/Cloudflare signed URLs with short TTLs and pass the auth check through an edge function.
