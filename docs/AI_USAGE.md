# AI Usage — VideoVault

This document describes where and how AI tooling (GitHub Copilot / Claude) was used during development, and the specific changes made to the generated drafts.

---

## Summary

AI-assisted code generation was used throughout the project as a productivity tool. All outputs were reviewed, adjusted, and validated manually before integration.

---

## Modules and AI Usage

### `lib/auth.ts` — JWT & bcrypt utilities

**Prompt used:** "Implement JWT sign/verify and bcrypt password hashing utilities for Next.js 16 using jsonwebtoken and bcryptjs"

**AI output:** Basic functions with `jwt.sign` and `bcrypt.compare`.

**Changes made:**
- Added `extractToken` function to support both `Authorization: Bearer` header AND cookie-based token extraction — the AI draft only covered the header case.
- Added `authenticateRequest` helper that combines extraction + verification, reducing boilerplate in every route — the AI draft expected this logic to be repeated per-route.
- Changed JWT expiry from `1h` to `7d` to improve UX for the project's session model.
- Added proper TypeScript return types for `JWTPayload`.

---

### `lib/s3.ts` — RustFS / S3 client

**Prompt used:** "Create an S3-compatible client for RustFS using @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner"

**AI output:** Basic client with PutObject and GetObject operations.

**Changes made:**
- Added `initBucket()` function with auto-creation of the `videos` bucket if it doesn't exist — the AI draft assumed the bucket was pre-created.
- Added `forcePathStyle: true` to the S3Client config, which is required for RustFS/MinIO compatibility but omitted by the AI.
- Added the presigned URL generation for PUT operations (direct upload) which the AI had implemented as server-side streaming instead.
- Fixed the endpoint URL to read from `RUSTFS_ENDPOINT` env var, not hardcoded.

---

### `app/api/upload/presign/route.ts` — Presigned URL generation

**Prompt used:** "Create a Next.js API route that generates a presigned S3 URL for direct browser-to-S3 upload"

**AI output:** Used `PutObjectCommand` but set the URL expiry to 3600s and didn't validate the content type.

**Changes made:**
- Reduced presigned URL expiry to `900` seconds (15 min) — more appropriate for a web upload session.
- Added file size validation in the metadata step.
- Added proper key namespacing: `{userId}/{timestamp}-{filename}` to prevent collisions.

---

### `app/api/stream/[id]/route.ts` — Byte-range streaming proxy

**Prompt used:** "Implement an HTTP 206 byte-range proxy in Next.js API route that reads from S3 and forwards to browser"

**AI output:** Did not handle byte-range headers at all, returning the full object always.

**Changes made:**
- Added full HTTP range header parsing (`Range: bytes=start-end`).
- Implemented proper `Content-Range` and `206 Partial Content` response headers.
- Added fallback to `200` for full-object requests without a range header.
- This was the most significantly rewritten section — the AI draft was non-functional for native HTML5 video seeking.

---

### `context/AuthContext.tsx` — React auth state

**Prompt used:** "Create a React Context for JWT-based auth state management in Next.js"

**AI output:** Used `localStorage` directly without SSR guard.

**Changes made:**
- Added `typeof window !== 'undefined'` guard for SSR compatibility.
- Added token validation on context initialization (calls `/api/auth/me` to verify the stored token is still valid).
- Added `logout` function that clears both `localStorage` and redirects to `/login`.

---

### Architecture and patterns

**AI involvement:** Low — the architecture decisions (presigned URLs, byte-range proxy, lib layer separation) were designed manually, and the AI was used to scaffold the boilerplate once the structure was decided.

**Key decision NOT taken from AI:** The AI initially suggested implementing video upload as a multipart/form-data POST to the Next.js server. This was rejected in favor of presigned URLs to avoid routing large binaries through the application server (see `docs/DECISIONS.md`).

---

## Conclusion

All AI-generated code was treated as a first draft and underwent manual review focused on:
1. Security (no hardcoded secrets, proper JWT validation, auth on all protected routes)
2. Correctness (byte-range streaming, S3 path-style config)
3. Architecture alignment (thin API routes, lib layer abstraction)
4. SSR compatibility (no direct DOM access in server components)
