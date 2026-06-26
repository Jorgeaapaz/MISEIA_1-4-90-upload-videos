@~/.claude/prompts/new_functionality_prompt_spec.md

# [001] Crear `.env.example` con Todas las Variables de Entorno

## Role
Act as a Software Developer and DevOps Engineer expert in Next.js, security best practices, and 12-factor app methodology.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** `d:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos`  
**Issue:** `dc_env_example` + `cq_sin_secretos_en_repo`  

El proyecto usa las siguientes variables de entorno (definidas en `AGENTS.md`):
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=videovault
RUSTFS_ENDPOINT=http://localhost:10000
RUSTFS_ACCESS_KEY=minioadmin
RUSTFS_SECRET_KEY=minioadmin1234
RUSTFS_BUCKET=videos
JWT_SECRET=upload-videos-dev-secret-2024
```
Actualmente **no existe `.env.example`**, y el README documenta credenciales en texto plano. El archivo `.env.local` real no debe estar en el repositorio.

## Task
1. Crear el archivo `.env.example` en la raíz del proyecto con todas las variables requeridas, sin valores reales (usar placeholders descriptivos).
2. Verificar que `.env.local` y `.env` están en `.gitignore`.
3. Actualizar el README para referenciar `.env.example` en lugar de mostrar credenciales en texto plano.
4. Añadir comentarios descriptivos en `.env.example` para cada variable.

### [001] Guidelines
- Los valores del `.env.example` deben ser placeholders descriptivos, NO valores reales: `your-jwt-secret-here`, `your-mongodb-uri`, etc.
- Para variables con valores default de desarrollo conocidos (e.g., `localhost:27017`), usar el valor real solo si es el default público del servicio (MongoDB, no secretos).
- El `.gitignore` debe incluir: `.env`, `.env.local`, `.env.*.local`.
- El README debe mostrar el `.env.example` como referencia, indicando al usuario que copie y complete los valores.

## Output format
Archivos a crear/modificar:
```
.env.example         ← NUEVO
.gitignore           ← VERIFICAR/ACTUALIZAR  
README.md            ← ACTUALIZAR sección "Environment"
```

## Examples and Steps to follow
1. Leer `AGENTS.md` para obtener la lista completa de variables requeridas.
2. Leer el `README.md` actual para identificar la sección a modificar.
3. Verificar `.gitignore` para confirmar que `.env.local` está excluido.
4. Crear `.env.example` con placeholders y comentarios.
5. Actualizar README para referenciar `.env.example`.

## Output checklist and Guardrails
- [ ] `.env.example` existe en la raíz del proyecto
- [ ] Todos los campos tienen placeholders descriptivos (NO valores reales de producción)
- [ ] `.gitignore` incluye `.env`, `.env.local`, `.env.*.local`
- [ ] README referencia `.env.example` con instrucción `cp .env.example .env.local`
- [ ] No se exponen credenciales reales en ningún archivo commiteado
- [ ] El proyecto sigue arrancando con `npm run dev` después de los cambios
