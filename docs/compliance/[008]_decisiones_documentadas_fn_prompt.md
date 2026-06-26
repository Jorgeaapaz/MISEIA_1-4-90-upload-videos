@~/.claude/prompts/new_functionality_prompt_spec.md

# [008] Documentar Decisiones Técnicas y Trade-offs

## Role
Act as a Software Architect and Technical Writer expert in documenting architectural decisions and technical trade-offs.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** `d:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos`  
**Issue:** `dc_decisiones_documentadas`  

El README no tiene una sección de decisiones técnicas. Se requiere documentar al menos **2 trade-offs reales** que se tomaron durante el desarrollo del proyecto. Las decisiones clave identificadas son:

1. **Presigned URLs vs Server-side upload** — Se usa presign para que el browser suba directamente a RustFS, evitando pasar el binario por el servidor Next.js.
2. **JWT stateless vs sesiones en base de datos** — JWT elimina la necesidad de un store de sesiones, pero complica la revocación de tokens.
3. **MongoDB vs SQL para metadatos** — MongoDB fue elegido por el esquema flexible de key-value pairs y tags dinámicos.
4. **Byte-range proxy en Next.js vs streaming URL directo** — Proxied streaming permite autenticación pero añade latencia; URL directo de RustFS no requería autenticación.

## Task
1. Agregar sección "Technical Decisions & Trade-offs" al README.md.
2. Documentar al menos **4 decisiones técnicas reales** con:
   - Decisión tomada
   - Alternativa considerada
   - Por qué se eligió esta opción
   - Trade-offs aceptados
3. Las decisiones deben ser específicas al proyecto, no genéricas.

### [008] Guidelines
- Las decisiones deben ser específicas: "Usé MongoDB porque el esquema de key-value arbitrario en videos hace difícil un schema SQL fijo" — no "usé MongoDB porque es popular".
- Cada decisión debe mencionar la alternativa concreta que se descartó.
- Los trade-offs deben ser honestos (incluir las desventajas de la decisión tomada).
- La sección puede ir en el README o en un archivo separado `docs/DECISIONS.md`.
- Si se crea `docs/DECISIONS.md`, agregar link desde el README.
- Formato sugerido para cada decisión:

```markdown
### D1: [Nombre de la Decisión]
**Decisión:** [Qué se hizo]
**Alternativa:** [Qué se consideró]
**Razón:** [Por qué se eligió esta opción]
**Trade-off aceptado:** [Desventaja conocida]
```

## Output format
Archivos a crear/modificar:
```
README.md                  ← ACTUALIZAR (sección "Technical Decisions")
docs/DECISIONS.md          ← NUEVO (opcional, si es extenso)
```

## Examples and Steps to follow
1. Identificar las 4 decisiones clave del proyecto leyendo el README actual.
2. Para cada decisión, formular: qué se hizo, qué se descartó, por qué, trade-off.
3. Agregar la sección al README (o crear `docs/DECISIONS.md`).
4. Vincular desde README si es archivo separado.

### Decisiones de Referencia a Documentar
- **D1: Presigned URLs para upload** (vs. multipart/form-data al servidor Next.js)
- **D2: JWT stateless** (vs. sesiones en MongoDB/Redis)
- **D3: MongoDB flexible schema** (vs. PostgreSQL relacional para metadatos)
- **D4: Byte-range proxy en Next.js** (vs. URLs públicas de RustFS con TTL)

## Output checklist and Guardrails
- [ ] Mínimo 4 decisiones técnicas documentadas
- [ ] Cada decisión menciona la alternativa descartada
- [ ] Las decisiones son específicas del proyecto (no genéricas)
- [ ] Los trade-offs incluyen las desventajas reales de la decisión tomada
- [ ] La sección está en README o enlazada desde README
- [ ] El contenido existente del README no fue alterado
