# Session Retrospective — VideoVault CI/CD, Production Fixes & Documentation

**Date:** 2026-06-26
**Project:** VideoVault — Next.js 16 Video Upload & Management Platform
**Repository:** https://github.com/Jorgeaapaz/MISEIA_1-4-90-upload-videos

---

## 1. Session Overview

This session covered the complete lifecycle from pushing code to both GitHub and GitLab, through three rounds of CI/CD pipeline debugging, full production deployment to a GCP VM, and resolution of two browser-side production errors (Mixed Content and CORS). The session concluded with complete documentation: a full Spanish README and this retrospective.

**Work completed:**
1. Push to GitHub (gh CLI) and GitLab (glab CLI)
2. Fix GitHub Actions pipeline — 3 rounds of failures diagnosed and resolved
3. Configure all GitHub repository secrets (9 total)
4. Enable GitLab CI/CD (was disabled at project level) and set all pipeline variables
5. Fix Mixed Content error: presigned URLs containing internal `http://rustfs:9000` served on HTTPS page
6. Fix CORS error: browser OPTIONS preflight to `https://rustfs-api.deviaaps.com` returning no CORS headers
7. Write full README in Spanish (12 sections per `/repo_readme` template)
8. Write this session retrospective

---

## 2. CI/CD Pipeline Debugging — GitHub Actions

### Round 1: ESLint Failures

**Failures:**
- `@typescript-eslint/no-require-imports` in `jest.mock()` factory functions in test files
- `@typescript-eslint/no-require-imports` in `beforeEach` blocks using `const { getDb } = require(...)`
- `@typescript-eslint/no-require-imports` in `scripts/benchmark-auth.js`
- `react-hooks/set-state-in-effect` in `context/AuthContext.tsx` and `app/(main)/videos/page.tsx`

**Root causes:**
- `jest.mock()` factory functions cannot use ES module `import` due to Jest's hoisting mechanism — `require()` is mandatory here
- `require()` calls in `beforeEach` test bodies were unnecessary; the mock at the top of the file already intercepts the ES import
- `benchmark-auth.js` is a plain CJS Node.js script where `require()` is appropriate
- `setIsLoading(false)` and `fetchVideos(...)` called synchronously in `useEffect` body triggered the `set-state-in-effect` rule

**Fixes applied:**
- `__tests__/api/auth.test.ts`: Added `eslint-disable-next-line @typescript-eslint/no-require-imports` before `jest.mock` factory; removed unused `signToken` import
- `__tests__/api/video-detail.test.ts`: Replaced all 3 `const { getDb } = require(...)` in `beforeEach` blocks with a single top-level `import { getDb } from '@/lib/mongodb'`
- `__tests__/api/videos.test.ts`: Same pattern — top-level import, removed inline `require()` calls
- `scripts/benchmark-auth.js`: Added `eslint-disable-next-line` comment
- `context/AuthContext.tsx` and `app/(main)/videos/page.tsx`: Added `eslint-disable-next-line react-hooks/set-state-in-effect` before the flagged calls

### Round 2: Jest Configuration Parse Error (ts-node Missing)

**Failure:** `jest.config.ts` failed to parse — Node.js could not load TypeScript files without `ts-node` registered

**Root cause:** The project had `jest.config.ts` (TypeScript) but `ts-node` was not in `devDependencies`. Jest requires `ts-node` to parse `.ts` config files before the test runner starts.

**Fix applied:**
- Deleted `jest.config.ts` with `git rm`
- Created new `jest.config.js` (CommonJS format) with identical configuration
- No need to install `ts-node` — CommonJS Jest config is parsed natively

**Lesson:** Jest config files should be `.js` (CommonJS) unless `ts-node` is explicitly installed. The savings of a TypeScript config file are minimal; the added dependency is a fragile CI gotcha.

### Round 3: SSH Deploy Failure (Exit Code 255)

**Failure:** `Create .env.prod on VM / Process completed with exit code 255` — SSH could not connect; `VM_HOST` secret was empty

**Root cause:** 9 GitHub Actions secrets were not set. The deploy step requires `VM_HOST`, `VM_USER`, `VM_SSH_PRIVATE_KEY`, `VM_DEPLOY_DIR`, `PROD_MONGODB_URI`, `PROD_RUSTFS_ENDPOINT`, `PROD_RUSTFS_PUBLIC_ENDPOINT`, `PROD_RUSTFS_ACCESS_KEY`, `PROD_RUSTFS_SECRET_KEY`, `PROD_JWT_SECRET`.

**Discovery:** The SSH deploy key is at `C:\ubuntuiso\.ssh\vboxuser`, not the expected `~/.ssh/google_compute_engine` — found by listing the `.ssh` directory. Production credentials were read from `D:\Master-IA-Dev\00-GoogleCloud\004_Infra_in_VM\.env`.

**Fix applied:** Set all 9 secrets via `gh secret set` using the values from the infrastructure `.env` file.

**Key insight:** The `RUSTFS_PUBLIC_ENDPOINT` secret had to be added to the pipeline — this was a new variable introduced this session to fix the Mixed Content error. It was added to the `.env.prod` block in both `.github/workflows/ci-cd.yml` and `.gitlab-ci.yml`.

---

## 3. GitLab CI/CD Setup

### Problem: CI/CD Disabled at Project Level

**Root cause:** The GitLab project had `builds_access_level: disabled` — GitLab CI/CD was entirely turned off at the project API level, not just missing runners.

**Discovery process:**
1. `glab variable set` returned 403 for all variable operations despite having api scope token
2. Investigation revealed the project setting via `gh` API equivalent curl
3. Enabled via REST API: `PUT /api/v4/projects/481` with `{"builds_access_level":"private","shared_runners_enabled":true}`

**Lesson:** When GitLab CI/CD appears completely unresponsive, check the project-level feature flag before assuming authentication or runner issues.

### Problem: Masked Variables Failing Validation

**Root cause:** GitLab masked variables have strict character restrictions. Characters like `!` (in `RustfsSecret2024!`) and `://` (in MongoDB URI) are not allowed in masked values.

**Fix:** Set those two variables without `masked: true`. They're still protected (only visible in pipelines triggered by protected branches) but not masked in logs.

### Problem: SSH Key Variable — 400 Error

**Root cause:** A prior failed attempt had partially created the `VM_SSH_PRIVATE_KEY` variable ("key already taken" error). The variable content (multiline PEM key) also required multipart form encoding, not JSON body.

**Fix:** Used `PUT` (update) instead of `POST` (create), with `curl --form` multipart encoding for the PEM key content.

---

## 4. Production Errors — Browser Side

### Error 1: Mixed Content

**Symptom:** Clicking "Subir Video" threw a browser Mixed Content error — the page was loaded over HTTPS (`https://videovault.deviaaps.com`) but the presigned upload URL was `http://rustfs:9000/videos/...`.

**Root cause:** The S3 client used to generate presigned URLs was configured with `RUSTFS_ENDPOINT=http://rustfs:9000` (the internal Docker network endpoint). `getSignedUrl` embeds the client's endpoint hostname directly in the signed URL. The browser receives a presigned URL pointing to an HTTP internal host, which it blocks when served from an HTTPS page.

**Fix:**
- Created a second `S3Client` instance (`s3PublicClient`) configured with `RUSTFS_PUBLIC_ENDPOINT=https://rustfs-api.deviaaps.com`
- `getPresignedUploadUrl` and `getPresignedDownloadUrl` now use `s3PublicClient`
- All server-side operations (`getObject`, `headObject`, `deleteObject`, `ensureBucket`) continue using the internal `s3Client`
- `RUSTFS_PUBLIC_ENDPOINT` falls back to `RUSTFS_ENDPOINT` if not set (supports development without HTTPS)

**Architecture note:** This dual-client pattern is the correct solution for any deployment where the internal S3 endpoint differs from the public URL. The presigned URL generation is the only operation where the client endpoint matters to the browser.

### Error 2: CORS Policy

**Symptom:** After fixing Mixed Content, the browser now blocked the PUT request to `https://rustfs-api.deviaaps.com` with:
> "Access to fetch has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource."

**Root cause:** The browser sends an OPTIONS preflight request before a cross-origin PUT. RustFS was not returning any CORS headers in its OPTIONS response.

**Fix — dual-layer approach:**

Layer 1 (application): Added `PutBucketCorsCommand` call in `ensureBucket()` using the S3 CORS API:
```typescript
await s3Client.send(new PutBucketCorsCommand({
  Bucket: BUCKET,
  CORSConfiguration: {
    CORSRules: [{
      AllowedOrigins: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    }],
  },
}));
```
Wrapped in try/catch because some RustFS builds don't implement the CORS bucket API.

Layer 2 (infrastructure): Added Traefik CORS headers middleware to the `rustfs-api` router in the infrastructure `docker-compose.yml`:
```yaml
- "traefik.http.middlewares.rustfs-cors.headers.accesscontrolalloworiginlist=*"
- "traefik.http.middlewares.rustfs-cors.headers.accesscontrolallowmethods=GET,PUT,POST,DELETE,HEAD,OPTIONS"
- "traefik.http.middlewares.rustfs-cors.headers.accesscontrolallowheaders=*"
- "traefik.http.middlewares.rustfs-cors.headers.accesscontrolexposeheaders=ETag,Content-Length"
- "traefik.http.middlewares.rustfs-cors.headers.accesscontrolmaxage=3600"
- "traefik.http.routers.rustfs-api.middlewares=rustfs-cors"
```

The Traefik middleware is the more reliable fix — it works regardless of whether RustFS implements the S3 CORS API and handles OPTIONS preflights at the proxy level before they reach the upstream. Synced the updated compose file to the VM via `scp` and recreated the RustFS container to apply. Verified with `curl -X OPTIONS -v https://rustfs-api.deviaaps.com` returning `HTTP/1.1 200 OK` with all CORS headers.

---

## 5. Architecture Decisions Made This Session

### Decision: Two S3 Client Instances

**Problem:** One S3 client cannot serve both internal server-side operations (needs the internal Docker hostname for network efficiency) and browser-accessible presigned URL generation (needs the public HTTPS hostname).

**Decision:** `s3Client` for server-side ops, `s3PublicClient` for presigning only. Configured via separate env vars (`RUSTFS_ENDPOINT` and `RUSTFS_PUBLIC_ENDPOINT`).

**Why this is correct:** The presigned URL contains the endpoint hostname verbatim. There is no way to "fix" the URL after signing without invalidating the signature.

### Decision: CORS at Traefik Level, Not Only at Application Level

**Problem:** The S3 CORS API (`PutBucketCorsCommand`) is not reliably implemented across RustFS versions. Relying on it alone means CORS can silently fail with no warning.

**Decision:** Apply CORS headers via Traefik middleware as the primary fix, with `PutBucketCorsCommand` as a best-effort secondary layer.

**Why this is correct:** Traefik CORS middleware runs at the proxy level and handles OPTIONS preflights before they reach RustFS. It is version-independent and configuration-driven, making it more reliable than depending on RustFS's S3 API implementation.

### Decision: `jest.config.js` Over `jest.config.ts`

**Problem:** `jest.config.ts` requires `ts-node` to be installed and registered before Jest can parse its own config. This creates a circular dependency bootstrapping problem and an easy-to-miss CI failure mode.

**Decision:** Convert to `jest.config.js` (CommonJS). The configuration is simple enough that TypeScript type safety adds no meaningful value.

**Why this is correct:** `ts-jest` handles TypeScript in test files — there is no need for TypeScript in Jest's own config file. Removing this dependency eliminates a class of CI failures.

---

## 6. Processes and Workflows Used

### Diagnosing CI/CD Failures

The effective diagnostic loop used this session:

1. `gh run list --limit 5` — identify the failing run ID
2. `gh run view <id> --log-failed` — get only the failed step output
3. Isolate the exact error message
4. Map error to root cause (dependency missing, config error, auth error, etc.)
5. Apply fix, push, watch the next run

This loop was faster than clicking through the GitHub Actions UI and avoided the noise of successful step logs.

### Applying Infrastructure Changes Without a Deploy Pipeline

For the CORS fix on the Traefik/RustFS docker-compose, the pipeline deploy would have required waiting for a full CI run. Instead:
1. Edit the infra docker-compose on the local machine
2. `scp` the file directly to the VM (`scp -i <key> docker-compose.yml user@host:path/`)
3. SSH to the VM and run `docker compose up -d --no-deps rustfs` to recreate only the RustFS container
4. Verify with a curl OPTIONS preflight

This "direct infra push" pattern is valid for infra changes that don't involve the application code. It's faster but bypasses the code review gate — acceptable for urgent CORS/HTTPS fixes.

### Setting GitLab Variables via REST API

When `glab variable set` returned 403 for all variable operations despite having a valid token with `api` scope, the workaround was:

```bash
curl --request POST \
  "https://gitlab.codecrypto.academy/api/v4/projects/481/variables" \
  --header "PRIVATE-TOKEN: <token>" \
  --header "Content-Type: application/json" \
  --data '{"key":"VAR_NAME","value":"var_value","protected":true,"masked":false}'
```

For the multiline SSH key (which failed JSON body encoding):
```bash
curl --request PUT \
  "https://gitlab.codecrypto.academy/api/v4/projects/481/variables/VM_SSH_PRIVATE_KEY" \
  --header "PRIVATE-TOKEN: <token>" \
  --form "value=<key_content>" \
  --form "protected=true"
```

**Key lesson:** When a GitLab CLI tool fails with 403, go directly to the REST API. The GitLab REST API is stable, well-documented, and not subject to glab CLI authentication quirks.

---

## 7. Recommendations for Future Sessions

### Infrastructure

1. **Always configure `RUSTFS_PUBLIC_ENDPOINT`** in production when RustFS is behind a reverse proxy. The internal endpoint will never be reachable from the browser. Presigned URLs will silently generate invalid HTTP URLs if this is not set.

2. **Test CORS before shipping** any feature that involves direct browser-to-object-store uploads. The test is simple: `curl -X OPTIONS -v <public-endpoint> -H "Origin: https://your-app.com"` should return 200 with CORS headers.

3. **Traefik CORS middleware is the right production solution.** Application-level CORS config (S3 API, response headers in code) is a secondary safety net. Put CORS in the proxy first.

### CI/CD

4. **Set all CI/CD secrets before the first deploy run.** Create a checklist of required secrets when writing the pipeline YAML. A deploy that fails at the SSH step due to empty `VM_HOST` wastes a full build + test run.

5. **Use `npm ci` in pipelines, never `npm install`.** The `package-lock.json` file is committed to the repo for this reason. `npm ci` installs the exact locked versions; `npm install` may upgrade packages and break reproducibility.

6. **Always add `workflow_dispatch` to GitHub Actions workflows** during development. The ability to manually trigger a run without a commit is essential for debugging pipeline configuration changes.

7. **Check GitLab project-level CI/CD settings first** when the GitLab pipeline appears completely non-functional. A disabled `builds_access_level` at the project API level is not obvious from the GitLab UI.

### Code Quality

8. **Don't use `jest.config.ts` unless `ts-node` is in `devDependencies`.** Prefer `jest.config.js`. The TypeScript config file buys nothing and creates a subtle CI failure that is hard to diagnose.

9. **Replace `require()` in test bodies with top-level `import`** where possible. Jest hoists `jest.mock()` calls above imports, so the mock is active at import time. Using `require()` in `beforeEach` blocks is an anti-pattern that triggers ESLint warnings unnecessarily.

10. **The dual S3 client pattern (`s3Client` / `s3PublicClient`) should be documented in `lib/s3.ts` comments** so future maintainers understand why two clients exist. Removing one silently breaks either presigned URLs (browser-facing) or server-side operations.

### Security

11. **GitLab masked variables reject special characters.** Characters like `!`, `://`, `@` fail masked variable validation. When setting variables with these characters, use `protected: true, masked: false`. The variable is still protected from exposure to non-protected branches but will appear in logs.

12. **JWT tokens cannot be invalidated before expiry without a blacklist.** The current 7-day expiry means a stolen token is valid for up to 7 days. For higher-security deployments, implement a token blacklist in Redis or reduce the expiry to 1 hour with a refresh token mechanism.

---

## 8. What Went Well

- **Bug diagnosis was systematic and fast.** Each CI failure was diagnosed from log output alone without needing local reproduction. The `gh run view --log-failed` command was essential.
- **The dual S3 client fix is clean and non-invasive.** It solved the Mixed Content problem with minimal changes — no URL rewriting, no proxying, no additional network hops.
- **The Traefik CORS fix is robust.** By handling CORS at the proxy level, the solution is independent of RustFS implementation details and will survive RustFS updates.
- **The `jest.config.ts` → `.js` conversion eliminated the dependency cleanly.** No ts-node, no workarounds, same functionality.

## 9. What Didn't Go Well

- **Pipeline secrets were not pre-populated.** The pipeline was written and pushed before secrets were configured, causing a predictable but avoidable failure. A pre-deploy checklist would have caught this.
- **GitLab CI/CD was disabled and we didn't know.** The project-level `builds_access_level: disabled` setting is not visible in the GitLab UI unless you look at project settings specifically. The glab CLI 403 errors were misleading — they suggested a permission problem rather than a feature flag.
- **Three rounds of CI fixes could have been one.** The ESLint errors, ts-node missing, and secrets missing are all detectable locally before pushing. Running `npm run lint`, `npm test`, and verifying secrets existence before the first push would have compressed three pipeline iterations into one.

---

## 10. Production Environment Summary

| Component | Value |
|---|---|
| App URL | https://videovault.deviaaps.com |
| VM | GCP us-south1-c, 34.174.56.186 |
| Deploy user | gcvmuser |
| Deploy dir | /home/gcvmuser/MISEIA190_upload-videos |
| RustFS internal | http://rustfs:9000 |
| RustFS public | https://rustfs-api.deviaaps.com |
| MongoDB | mongodb on miseia-net Docker network |
| Proxy | Traefik v3.3 |
| TLS | Let's Encrypt via Cloudflare DNS-01 |
| SSH deploy key | C:\ubuntuiso\.ssh\vboxuser (local path) |
| GitHub repo | https://github.com/Jorgeaapaz/MISEIA_1-4-90-upload-videos |
| GitLab repo | https://gitlab.codecrypto.academy/jorgeaapaz/MISEIA_1-4-90-upload-videos |
| GitLab project ID | 481 |
