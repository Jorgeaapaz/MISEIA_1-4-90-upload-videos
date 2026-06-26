@~/.claude/prompts/new_functionality_prompt_spec.md

# [009] Documentar Uso de IA y Cambios Realizados

## Role
Act as a Software Developer and Technical Writer with expertise in documenting AI-assisted development processes.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** `d:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos`  
**Issue:** `dc_cambios_ia_documentados`  

El proyecto fue desarrollado con asistencia de IA (GitHub Copilot / Claude). El criterio `dc_cambios_ia_documentados` requiere documentar:
- Qué partes fueron generadas con IA
- Qué cambios se realizaron respecto al borrador inicial
- Evidencia de revisión crítica (no solo aceptar el output sin revisión)

## Task
1. Crear el archivo `docs/AI_USAGE.md` documentando el uso de IA en el proyecto.
2. Listar los módulos donde se usó IA.
3. Describir los cambios realizados al código generado por IA.
4. Agregar referencia a `docs/AI_USAGE.md` desde el README.

### [009] Guidelines
- El documento debe ser honesto: no minimizar ni exagerar el uso de IA.
- Para cada sección del código generado con IA, describir:
  - Qué se le pidió a la IA
  - Qué problemas tenía el output inicial
  - Qué cambios se hicieron manualmente
- Si una sección fue generada mayormente sin IA, también mencionarlo.
- El objetivo es demostrar revisión crítica, no que "escribí todo yo".
- Formato sugerido por sección:

```markdown
### [Módulo] — lib/auth.ts
**Prompt usado:** "Implement JWT sign/verify with HS256 and bcrypt password hashing for Next.js"
**Output IA:** Generó funciones básicas con `jsonwebtoken` y `bcryptjs`
**Cambios realizados:**
- Ajustado el tipo de retorno para compatibilidad con TypeScript estricto
- Modificado el payload del JWT para incluir `name` además de `userId` y `email`
- Cambiada la expiración de `1h` a `7d` según requerimientos del proyecto
**Revisión crítica:** Se verificó que el `JWT_SECRET` se lee de `process.env` y no está hardcodeado
```

## Output format
Archivos a crear/modificar:
```
docs/AI_USAGE.md    ← NUEVO
README.md           ← ACTUALIZAR (agregar referencia a docs/AI_USAGE.md)
```

## Examples and Steps to follow
1. Listar los módulos principales del proyecto.
2. Para cada módulo, describir el nivel de asistencia IA.
3. Documentar los cambios más significativos respecto a borradores de IA.
4. Agregar sección "AI Usage" al README con link a `docs/AI_USAGE.md`.

### Módulos a Documentar (referencia)
- `lib/auth.ts` — Utilidades JWT/bcrypt
- `lib/s3.ts` — Cliente RustFS + bucket auto-create
- `lib/mongodb.ts` — Singleton MongoDB
- `app/api/` — API Routes
- `components/UploadForm.tsx` — Upload con progreso
- `context/AuthContext.tsx` — Estado de autenticación
- `app/(main)/` — Páginas principales
- Architecture decisions and patterns

## Output checklist and Guardrails
- [ ] `docs/AI_USAGE.md` creado con al menos 5 módulos documentados
- [ ] Cada módulo describe qué se cambió respecto al output IA
- [ ] Se mencionan al menos 3 problemas/limitaciones encontradas en el output IA
- [ ] README tiene referencia/link a `docs/AI_USAGE.md`
- [ ] El documento es honesto (no dice "todo fue manual" si no lo fue)
- [ ] No se incluyen prompts completos con información sensible
