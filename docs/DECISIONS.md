# Technical Decisions & Trade-offs — VideoVault

This document captures the key architectural and design decisions made during the development of VideoVault, with explicit trade-offs for each choice.

---

## D1: Presigned URLs for Client-Side Upload (vs. Server-Side Multipart)

**Decision:** The browser uploads video files directly to RustFS using presigned PUT URLs. The Next.js server only generates the URL (`POST /api/upload/presign`) and later saves the metadata (`POST /api/videos`).

**Alternative considered:** Multipart/form-data upload to the Next.js API, which would stream the file to RustFS server-side.

**Why this was chosen:**
- A 500 MB video routed through Next.js would consume server memory proportional to the file size (or require complex streaming), while presigned upload uses zero server memory for the binary data.
- Eliminates a bottleneck: the browser uploads directly to the object store at full available bandwidth; no intermediate hop.
- Aligns with how S3-compatible stores are designed to be used.

**Trade-off accepted:**
- The browser must support CORS PUT requests to RustFS (requires CORS configuration on the bucket).
- The presigned URL has a 15-minute expiry; uploads that take longer will fail (acceptable for typical web video sizes).
- Error handling is split: upload errors come from RustFS directly, metadata errors from the Next.js API.

---

## D2: JWT Stateless Authentication (vs. Session Store in MongoDB/Redis)

**Decision:** Authentication uses JWTs (HS256, 7-day expiry) stored client-side in localStorage. Each API request includes the token in the `Authorization: Bearer` header. The server validates the signature without any database lookup.

**Alternative considered:** Server-side sessions stored in MongoDB or Redis, with a session cookie.

**Why this was chosen:**
- Stateless validation requires zero database round-trips for auth — token verification is a local CPU operation (~0.1ms) vs. a MongoDB query (~5-15ms on the same machine).
- No session store to manage, provision, or back up.
- Simpler horizontal scaling: any instance can verify any token without shared state.

**Trade-off accepted:**
- Token revocation is not possible before expiry (7 days). A user who is deleted cannot be immediately invalidated until their token expires. For a video management tool (not a banking app), this is an acceptable risk.
- Tokens are stored in localStorage, which is accessible to JavaScript (XSS risk). Mitigated by CSP headers and not storing sensitive data beyond the userId/email/name in the payload.

---

## D3: MongoDB with Flexible Schema for Video Metadata (vs. PostgreSQL)

**Decision:** MongoDB is used for all metadata: users and video metadata including arbitrary key-value pairs and dynamic tags arrays.

**Alternative considered:** PostgreSQL with a JSONB column for the key-value metadata, and a separate `video_tags` junction table.

**Why this was chosen:**
- The project specification explicitly requires "arbitrary key-value pairs" and "multi-value tags" as first-class features. In MongoDB, `{ metadata: { codec: 'h264', project: 'alpha' }, tags: ['2024', 'promo'] }` is natural; in PostgreSQL it requires JSONB operators or junction tables.
- Full-text search across name, description, and tags is native in MongoDB via text indexes; in PostgreSQL it requires `tsvector` columns and `to_tsvector` queries.
- Schema flexibility means adding new metadata fields requires no migrations.

**Trade-off accepted:**
- No relational integrity: deleting a user does not automatically cascade-delete their videos (handled in application logic).
- No JOIN support: fetching user info alongside video info requires two queries or `$lookup` aggregation (currently not needed since users see only their own videos).
- MongoDB's BSON ObjectId is less ergonomic than PostgreSQL's `SERIAL` or `UUID` primary keys in some client contexts.

---

## D4: HTTP Byte-Range Proxy in Next.js for Video Streaming (vs. Direct Presigned GET URLs)

**Decision:** Video playback goes through `/api/stream/[id]`, which fetches the object from RustFS server-side and streams it back to the browser with proper `206 Partial Content` and `Content-Range` headers.

**Alternative considered:** Generate a short-lived presigned GET URL for each video and expose it directly in the `<video src>` tag.

**Why this was chosen:**
- A presigned GET URL would expose the RustFS endpoint and bucket structure to the browser, requiring RustFS to be publicly accessible. In the production setup, RustFS is on a private Docker network.
- Authentication is enforced: only the token owner can stream their video. With a presigned GET URL, the URL could be shared and used by unauthenticated users for the duration of the URL's validity.
- Allows future server-side processing (watermarking, transcoding hooks) without changing the client API.

**Trade-off accepted:**
- All video bandwidth passes through the Next.js server, which acts as a bandwidth bottleneck and increases server load proportional to concurrent viewers.
- Streaming latency is slightly higher (extra network hop) compared to direct CDN delivery.
- For a production system with many concurrent viewers, a CDN with signed URLs (CloudFront, Cloudflare) would be the correct solution.
