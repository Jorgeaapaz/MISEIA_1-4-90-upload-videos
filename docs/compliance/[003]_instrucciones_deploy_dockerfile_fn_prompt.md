@~/.claude/prompts/new_functionality_prompt_spec.md

# [003] Crear Dockerfile e Instrucciones de Deploy de Producción

## Role
Act as a DevOps Engineer and Software Architect expert in Docker, Next.js production builds, and cloud deployments on Google Cloud Platform.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** `d:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos`  
**Issue:** `dc_instrucciones_deploy`  

**Infraestructura GCP disponible:**
- VM: `gcvmuser@34.174.56.186` (SSH: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`)
- Traefik v3.3 corriendo en la VM con wildcard `*.deviaaps.com`
- Red Docker: `miseia-net`
- MongoDB en VM: `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- RustFS en VM: accesible en `https://rustfs-api.deviaaps.com` (port 9000 en red interna)
- Puerto de servicio asignado: `30001`
- Dominio target: `videovault.deviaaps.com`

**Variables de entorno de producción:**
```env
MONGODB_URI=mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin
MONGODB_DB=videovault
RUSTFS_ENDPOINT=http://rustfs:9000
RUSTFS_ACCESS_KEY=rustfsadmin
RUSTFS_SECRET_KEY=RustfsSecret2024!
RUSTFS_BUCKET=videos
JWT_SECRET=<strong-production-secret>
NODE_ENV=production
```

## Task
1. Crear `Dockerfile` multi-stage para Next.js 16 (build + runtime).
2. Crear `docker-compose.prod.yml` con el servicio VideoVault conectado a `miseia-net` y etiquetas Traefik.
3. Crear `.dockerignore` para excluir archivos innecesarios del build context.
4. Crear `deploy.sh` script de deploy en la VM remota.
5. Actualizar `README.md` con sección "Deploy to Production" con pasos verificables.

### [003] Guidelines
- Dockerfile debe ser multi-stage: `builder` (npm run build) → `runner` (node con output standalone).
- Configurar `next.config.ts` con `output: 'standalone'` para optimizar el bundle de producción.
- El docker-compose.prod.yml debe conectarse a la red `miseia-net` externa (no crear una nueva).
- Las etiquetas Traefik deben usar el certresolver `cloudflare` y el dominio `videovault.deviaaps.com`.
- El puerto interno del contenedor es `3000`; el puerto de acceso externo es `30001` (para el entrypoint de Traefik o publicado).
- El `JWT_SECRET` de producción debe ser un secreto fuerte (mínimo 32 caracteres aleatorios).
- El `deploy.sh` debe: copiar archivos, hacer `docker compose pull`, `docker compose up -d`.
- NO incluir secrets en el `docker-compose.prod.yml`; usar variables de entorno o archivo `.env.prod` (en `.gitignore`).

## Output format
Archivos a crear/modificar:
```
Dockerfile                  ← NUEVO
docker-compose.prod.yml     ← NUEVO
.dockerignore               ← NUEVO
deploy.sh                   ← NUEVO
next.config.ts              ← ACTUALIZAR (output: 'standalone')
README.md                   ← ACTUALIZAR (sección Deploy to Production)
```

## Examples and Steps to follow
1. Leer `next.config.ts` actual para conocer la configuración existente.
2. Crear `Dockerfile` multi-stage:
   - Stage `deps`: instala dependencias
   - Stage `builder`: `npm run build` con `NODE_ENV=production`
   - Stage `runner`: copia `.next/standalone`, `.next/static`, `public/`
3. Crear `docker-compose.prod.yml` con labels Traefik para `videovault.deviaaps.com`.
4. Crear `.dockerignore` excluyendo `node_modules`, `.next`, `.env*`, `docs/`.
5. Crear `deploy.sh` con instrucciones SSH + docker compose.
6. Actualizar README con sección de producción con comandos exactos.

## Output checklist and Guardrails
- [ ] `Dockerfile` construye sin errores con `docker build -t videovault .`
- [ ] `docker-compose.prod.yml` usa red `miseia-net` como externa
- [ ] Labels Traefik correctas para `videovault.deviaaps.com` con TLS
- [ ] `.env.prod` está en `.gitignore` (NO commiteado)
- [ ] `next.config.ts` tiene `output: 'standalone'`
- [ ] README tiene sección "Deploy to Production" con comandos verificables
- [ ] `deploy.sh` tiene instrucciones de SSH + docker compose up
- [ ] No hay secrets hardcodeados en ningún archivo commiteado
