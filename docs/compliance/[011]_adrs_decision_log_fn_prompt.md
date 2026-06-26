@~/.claude/prompts/new_functionality_prompt_spec.md

# [011] Crear ADRs (Architecture Decision Records)

## Role
Act as a Software Architect expert in documenting Architecture Decision Records following the MADR (Markdown Architectural Decision Records) format.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** `d:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos`  
**Issue:** `dc_adrs_o_decision_log`  

Los ADRs capturan las decisiones de arquitectura con su contexto, alternativas consideradas y consecuencias. Se necesitan ADRs para las decisiones clave del proyecto:

1. Elección de Next.js 16 como framework full-stack
2. Presigned URLs para upload directo al object store
3. MongoDB vs SQL para metadatos de video
4. JWT stateless vs sesiones persistentes
5. RustFS como S3-compatible object store

## Task
1. Crear el directorio `docs/adr/`.
2. Crear un ADR por cada decisión clave (mínimo 4 ADRs).
3. Seguir el formato MADR (Markdown Architectural Decision Records).
4. Crear un `docs/adr/README.md` con el índice de ADRs.
5. Agregar referencia a los ADRs desde el README principal.

### [011] Guidelines
- Formato MADR para cada ADR:
  ```markdown
  # ADR-[NNN]: [Título]
  
  **Status:** Accepted | Deprecated | Superseded by ADR-XXX
  **Date:** YYYY-MM-DD
  **Deciders:** [nombres o roles]
  
  ## Context
  [Por qué se necesitó tomar esta decisión]
  
  ## Decision
  [La decisión tomada]
  
  ## Alternatives Considered
  | Option | Pros | Cons |
  |---|---|---|
  | Opción elegida | ... | ... |
  | Alternativa 1 | ... | ... |
  
  ## Consequences
  **Positive:** [beneficios]
  **Negative:** [trade-offs aceptados]
  **Risks:** [riesgos identificados]
  ```
- Los ADRs deben ser inmmutables una vez aceptados (no editarlos, crear uno nuevo que los superceda).
- Numeración secuencial: `ADR-001`, `ADR-002`, etc.
- Archivos: `docs/adr/ADR-001-nextjs-fullstack.md`, etc.

## Output format
Archivos a crear:
```
docs/adr/
  README.md                           ← NUEVO (índice)
  ADR-001-nextjs-fullstack.md         ← NUEVO
  ADR-002-presigned-url-upload.md     ← NUEVO
  ADR-003-mongodb-flexible-schema.md  ← NUEVO
  ADR-004-jwt-stateless-auth.md       ← NUEVO
  ADR-005-rustfs-object-storage.md    ← NUEVO
README.md                             ← ACTUALIZAR (referencia a docs/adr/)
```

## Examples and Steps to follow
1. Crear directorio `docs/adr/`.
2. Para cada decisión clave, analizar el contexto del proyecto y redactar el ADR.
3. El contexto debe describir el problema específico del proyecto, no genérico.
4. Las alternativas deben ser opciones reales (ej: "PostgreSQL con JSONB" vs "MongoDB").
5. Crear el índice en `docs/adr/README.md`.
6. Agregar sección en README principal: "Architecture Decision Records" con tabla de ADRs.

## Output checklist and Guardrails
- [ ] Mínimo 4 ADRs creados en `docs/adr/`
- [ ] Cada ADR tiene: contexto, decisión, alternativas, consecuencias
- [ ] Las alternativas son opciones técnicas reales (no genéricas)
- [ ] `docs/adr/README.md` tiene el índice de todos los ADRs
- [ ] README principal referencia `docs/adr/`
- [ ] Los ADRs tienen status (`Accepted`)
- [ ] Los contextos son específicos del proyecto VideoVault
