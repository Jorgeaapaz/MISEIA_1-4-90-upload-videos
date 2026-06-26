@~/.claude/prompts/new_functionality_prompt_spec.md

# [004] Crear Pipeline CI/CD con GitHub Actions

## Role
Act as a Software Architect, you are an expert in Github and Google Cloud Services.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** https://github.com/Jorgeaapaz/MISEIA_1-4-90-upload-videos  
**Issue:** `cq_ci_funcional`  

**Infraestructura de destino:**
- VM: `gcvmuser@34.174.56.186`
- SSH Key: `C:\ubuntuiso\.ssh\vboxuser` (private key)
- Directorio en VM: `~/MISEIA190_upload-videos`
- Dominio: `videovault.deviaaps.com`
- Puerto: `30001`
- Red Docker en VM: `miseia-net`
- Traefik wildcard: `*.deviaaps.com`

**Variables de entorno de producción:**
```env
MONGODB_URI=mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin
MONGODB_DB=videovault
RUSTFS_ENDPOINT=http://rustfs:9000
RUSTFS_ACCESS_KEY=rustfsadmin
RUSTFS_SECRET_KEY=RustfsSecret2024!
RUSTFS_BUCKET=videos
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
```

## Task
Create GitHub Actions workflow that allows to compile and deploy the app to the GCP VM in the directory `~/MISEIA190_upload-videos`. Tests and build must run in GitHub Actions. The service must be created in the remote Ubuntu VM in Docker.

The app must be accessible through Traefik using the domain `videovault.deviaaps.com`, port `30001`, using the Traefik wildcard `*.deviaaps.com`.

Use `/gh` and `gcloud` for all secrets required.

### Workflow Jobs
1. **test** — Run `npm test` (lint + unit tests)
2. **build** — Run `npm run build` with `NODE_ENV=production`
3. **deploy** — SSH to VM, copy files, `docker compose up -d`

### [004] Guidelines
- Workflow file: `.github/workflows/ci-cd.yml`
- Trigger: `push` to `main`/`master` branch + `pull_request` to `main`/`master`
- `NODE_ENV=production` only for the `npm run build` command, NOT as a job-level variable.
- Use `ubuntu-latest` runner for all jobs.
- Use GitHub Secrets for sensitive values (SSH key, production env vars).
- The `deploy` job only runs on `push` to `main`/`master` (not on PRs).
- SSH deploy using `appleboy/ssh-action` or native SSH with key stored as GitHub Secret.
- Docker image built on VM to avoid image registry complexity, OR use `docker build` + push to GHCR.
- Add status badge to README: `![CI](https://github.com/Jorgeaapaz/MISEIA_1-4-90-upload-videos/actions/workflows/ci-cd.yml/badge.svg)`

### GitHub Secrets to Create (use /gh CLI)
```bash
gh secret set VM_SSH_PRIVATE_KEY < C:\ubuntuiso\.ssh\vboxuser
gh secret set VM_HOST --body "34.174.56.186"
gh secret set VM_USER --body "gcvmuser"
gh secret set VM_DEPLOY_DIR --body "~/MISEIA190_upload-videos"
gh secret set PROD_MONGODB_URI --body "mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin"
gh secret set PROD_MONGODB_DB --body "videovault"
gh secret set PROD_JWT_SECRET --body "<generate-strong-secret>"
gh secret set PROD_RUSTFS_ENDPOINT --body "http://rustfs:9000"
gh secret set PROD_RUSTFS_ACCESS_KEY --body "rustfsadmin"
gh secret set PROD_RUSTFS_SECRET_KEY --body "RustfsSecret2024!"
gh secret set PROD_RUSTFS_BUCKET --body "videos"
```

## Output format
Archivos a crear/modificar:
```
.github/
  workflows/
    ci-cd.yml           ← NUEVO
README.md               ← ACTUALIZAR (badge de CI + sección CI/CD)
```

## Examples and Steps to follow
1. Usar `/gh` skill para crear los GitHub Secrets.
2. Crear `.github/workflows/ci-cd.yml` con 3 jobs: test, build, deploy.
3. En el job `deploy`, usar SSH para conectar a la VM y ejecutar comandos docker.
4. El job `deploy` debe escribir el `.env.prod` en la VM desde los GitHub Secrets.
5. Actualizar README con el badge de CI.

## Output checklist and Guardrails
- [ ] `.github/workflows/ci-cd.yml` creado y válido (YAML correcto)
- [ ] `npm run build` usa `NODE_ENV=production` SOLO en ese paso
- [ ] Job `test` corre `npm test` y falla el pipeline si hay errores
- [ ] Job `deploy` solo corre en push a `main`/`master`
- [ ] Todos los secrets son referencias `${{ secrets.NAME }}`, nunca hardcodeados
- [ ] README tiene badge de estado del workflow
- [ ] El servicio en VM está en red `miseia-net` con labels Traefik correctas
- [ ] `videovault.deviaaps.com` responde con HTTPS después del deploy
