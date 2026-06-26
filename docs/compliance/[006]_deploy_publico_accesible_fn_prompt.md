@~/.claude/prompts/new_functionality_prompt_spec.md

# [006] Deploy Público Accesible en GCP VM

## Role
Act as a DevOps Engineer and Software Architect expert in Docker, Traefik, and Google Cloud Platform deployments.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** https://github.com/Jorgeaapaz/MISEIA_1-4-90-upload-videos  
**Issue:** `fn_deploy_publico_accesible`  

**Pre-requisitos (deben estar completos antes de esta tarea):**
- Dockerfile creado (`[003]_instrucciones_deploy_dockerfile_fn_prompt.md`)
- CI/CD pipeline GitHub configurado (`[004]_ci_pipeline_github_fn_prompt.md`)

**Infraestructura GCP disponible:**
- VM: `gcvmuser@34.174.56.186`
- SSH: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`
- Directorio en VM: `~/MISEIA190_upload-videos`
- Traefik v3.3 corriendo en la VM con wildcard `*.deviaaps.com`
- Red Docker: `miseia-net`
- MongoDB producción: `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- RustFS acceso interno (en red miseia-net): servicio `rustfs` puerto `9000`
- Puerto de servicio: `30001`
- **Dominio target: `videovault.deviaaps.com`**

**Variables de entorno de producción:**
```env
MONGODB_URI=mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin
MONGODB_DB=videovault
RUSTFS_ENDPOINT=http://rustfs:9000
RUSTFS_ACCESS_KEY=rustfsadmin
RUSTFS_SECRET_KEY=RustfsSecret2024!
RUSTFS_BUCKET=videos
JWT_SECRET=<strong-production-secret-min-32-chars>
NODE_ENV=production
```

## Task
1. Realizar el primer deploy manual de VideoVault en la VM de GCP.
2. Verificar que la aplicación responde en `https://videovault.deviaaps.com`.
3. Documentar el proceso de deploy en el README.md con la URL pública.
4. Verificar que el certificado TLS de `*.deviaaps.com` cubre el subdominio.

### [006] Guidelines
- Conectarse a la VM via SSH: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`
- Crear directorio: `mkdir -p ~/MISEIA190_upload-videos`
- Clonar o copiar el proyecto al directorio.
- Crear `.env.prod` con las variables de producción (NUNCA commitearlo).
- El `docker-compose.prod.yml` debe:
  - Usar la red `miseia-net` como red externa (ya existe en la VM).
  - Tener el contenedor publicando en puerto `3000` internamente.
  - Labels Traefik apuntando a `videovault.deviaaps.com` con certresolver `cloudflare`.
- Ejecutar: `docker compose -f docker-compose.prod.yml up -d --build`
- Verificar logs: `docker compose -f docker-compose.prod.yml logs -f videovault`
- Actualizar README con la URL pública: `https://videovault.deviaaps.com`

### docker-compose.prod.yml labels de Traefik (referencia)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.videovault.rule=Host(`videovault.deviaaps.com`)"
  - "traefik.http.routers.videovault.entrypoints=websecure"
  - "traefik.http.routers.videovault.tls=true"
  - "traefik.http.routers.videovault.tls.certresolver=cloudflare"
  - "traefik.http.services.videovault.loadbalancer.server.port=3000"
networks:
  miseia-net:
    external: true
```

## Output format
Acciones a realizar:
```
VM: ~/MISEIA190_upload-videos/    ← Crear directorio y desplegar
VM: .env.prod                     ← Crear con variables de producción
VM: docker compose up -d          ← Ejecutar deploy
README.md                         ← ACTUALIZAR con URL pública y badge
```

## Examples and Steps to follow
1. SSH a la VM y verificar que Traefik está corriendo: `docker ps | grep traefik`
2. Verificar red `miseia-net`: `docker network ls | grep miseia-net`
3. Clonar repo: `git clone https://github.com/Jorgeaapaz/MISEIA_1-4-90-upload-videos.git MISEIA190_upload-videos`
4. Crear `.env.prod` con los valores de producción.
5. Ejecutar `docker compose -f docker-compose.prod.yml up -d --build`.
6. Verificar acceso: `curl -I https://videovault.deviaaps.com`
7. Actualizar README con URL pública y sección "Live Demo".

## Output checklist and Guardrails
- [ ] `https://videovault.deviaaps.com` responde con HTTP 200 o redirect login
- [ ] Certificado TLS válido (no self-signed)
- [ ] El login y registro funcionan con MongoDB de producción
- [ ] La subida de videos funciona con RustFS de producción
- [ ] README tiene sección "Live Demo" con URL `https://videovault.deviaaps.com`
- [ ] `.env.prod` NO está commiteado en el repositorio
- [ ] Los logs del contenedor no muestran errores de conexión a MongoDB/RustFS
- [ ] El contenedor tiene `restart: unless-stopped` para sobrevivir reinicios de VM
