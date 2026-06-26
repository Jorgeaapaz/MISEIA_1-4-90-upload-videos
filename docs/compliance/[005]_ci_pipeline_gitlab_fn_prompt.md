@~/.claude/prompts/new_functionality_prompt_spec.md

# [005] Crear Pipeline CI/CD con GitLab CI

## Role
Act as a Software Architect and DevOps Engineer expert in GitLab CI/CD and Google Cloud Platform deployments.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio GitLab (mirror):** MISEIA_1-4-90-upload-videos  
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
```

## Task
Usar `/glab` para crear el pipeline de CI/CD en GitLab. El pipeline debe compilar, testear y desplegar la aplicación en la VM de GCP en el directorio `~/MISEIA190_upload-videos`. El servicio debe ejecutarse en Docker en la VM remota.

La app debe ser accesible a través de Traefik con el dominio `videovault.deviaaps.com`, puerto `30001`, usando el wildcard `*.deviaaps.com`.

### Pipeline Stages
1. **test** — `npm ci` + `npm test` + `npm run lint`
2. **build** — `npm run build` con `NODE_ENV=production` SOLO en el script de ese job
3. **deploy** — SSH a la VM, copiar archivos, `docker compose up -d` (solo en rama `main`/`master`)

### [005] Guidelines
- Archivo: `.gitlab-ci.yml` en la raíz del proyecto.
- Usar `node:20-alpine` como imagen base para los jobs `test` y `build`.
- `NODE_ENV=production` debe estar SOLO en el comando `npm run build`, **NO como variable a nivel de job**.
- El stage `deploy` debe ejecutarse solo en `main`/`master` con `rules: - if: '$CI_COMMIT_BRANCH == "main"'`.
- Usar `artifacts` para pasar el build de un stage a otro.
- Usar GitLab CI/CD Variables (Settings → CI/CD → Variables) para los secrets.
- Cache de `node_modules` con key basada en `package-lock.json`.
- Deploy via SSH usando `sshpass` o clave SSH almacenada como variable protegida de GitLab.

### GitLab CI Variables a Configurar (usar /glab)
```bash
glab variable set VM_SSH_PRIVATE_KEY --value "$(cat C:\ubuntuiso\.ssh\vboxuser)" --masked
glab variable set VM_HOST --value "34.174.56.186"
glab variable set VM_USER --value "gcvmuser"
glab variable set VM_DEPLOY_DIR --value "~/MISEIA190_upload-videos"
glab variable set PROD_MONGODB_URI --value "mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin" --masked
glab variable set PROD_JWT_SECRET --value "<generate-strong-secret>" --masked
glab variable set PROD_RUSTFS_ACCESS_KEY --value "rustfsadmin" --masked
glab variable set PROD_RUSTFS_SECRET_KEY --value "RustfsSecret2024!" --masked
```

## Output format
Archivos a crear/modificar:
```
.gitlab-ci.yml          ← NUEVO
README.md               ← ACTUALIZAR (badge GitLab CI + sección CI/CD)
```

## Examples and Steps to follow
1. Usar `/glab` skill para crear las CI/CD Variables en GitLab.
2. Crear `.gitlab-ci.yml` con stages: `test`, `build`, `deploy`.
3. Stage `test`: `npm ci` + `npm test` en paralelo con linter.
4. Stage `build`: `npm run build` con `NODE_ENV=production` en el script (no en variables).
5. Stage `deploy`: SSH a VM, escribir `.env.prod`, ejecutar docker compose.
6. Actualizar README con badge de pipeline.

## Output checklist and Guardrails
- [ ] `.gitlab-ci.yml` es YAML válido y sin errores de sintaxis
- [ ] `NODE_ENV=production` aparece SOLO en el script del job `build`, no como variable de job
- [ ] Stage `deploy` tiene `rules` para correr solo en `main`/`master`
- [ ] Todos los secrets son referencias `$VARIABLE_NAME` (GitLab CI variables)
- [ ] Cache de `node_modules` configurada correctamente
- [ ] Artifacts del build pasan al stage de deploy
- [ ] SSH deploy escribe `.env.prod` desde variables de CI antes de `docker compose up -d`
- [ ] El servicio en VM está en red `miseia-net` con labels Traefik correctas
- [ ] `videovault.deviaaps.com` responde con HTTPS después del deploy
