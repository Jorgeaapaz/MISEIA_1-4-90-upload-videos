@~/.claude/prompts/new_functionality_prompt_spec.md

# [012] Justificación Cuantitativa de Decisiones Técnicas

## Role
Act as a Software Architect and Performance Engineer expert in benchmarking, latency analysis, and quantitative technical justification.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** `d:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos`  
**Issue:** `dc_justificacion_cuantitativa`  

El criterio requiere que al menos **una decisión técnica esté justificada con números**: benchmark, latencia medida, coste estimado, o comparación cuantitativa con una alternativa.

Decisiones candidatas para justificación cuantitativa:
1. **Presigned URL upload** vs upload proxied por servidor Next.js — diferencia en throughput y memoria
2. **JWT stateless** vs sesiones en MongoDB — diferencia en latencia de autenticación
3. **MongoDB** vs SQL para búsqueda full-text con tags — diferencia en query time con datos reales

## Task
1. Realizar al menos **1 benchmark o medición cuantitativa** real para justificar una decisión técnica.
2. Documentar los resultados en `docs/BENCHMARKS.md` o en la sección de decisiones del README.
3. Actualizar el ADR correspondiente con los datos cuantitativos.
4. El benchmark debe ser reproducible (incluir el código o herramienta usada).

### [012] Guidelines
- El benchmark debe ser relevante para el proyecto, no un benchmark sintético genérico.
- Opciones de medición:
  - **Upload directo vs proxied**: Medir tiempo de upload de un archivo de 50MB en ambas modalidades usando `curl` o un script JavaScript.
  - **JWT stateless**: Comparar tiempo de autenticación con `jwt.verify()` (microsegundos) vs query a MongoDB (milisegundos).
  - **MongoDB full-text search**: Comparar query con índice vs sin índice para 1000 registros.
- Incluir: número de iteraciones, percentiles (p50, p95, p99), condiciones del test.
- Si el benchmark se ejecuta localmente, documentar las specs del hardware.
- El código del benchmark debe estar en `docs/benchmarks/` o como script en `scripts/`.
- Actualizar el ADR relevante con los datos.

### Benchmark Sugerido (Presigned URL vs Proxied Upload)
```bash
# Upload directo (presigned URL - cliente al object store)
time curl -X PUT -T test-50mb.bin "https://rustfs-endpoint/presigned-url"

# Upload proxied (a través del servidor Next.js)
time curl -X POST -F "file=@test-50mb.bin" "http://localhost:3000/api/upload"
```

Medir:
- Tiempo total de upload
- Uso de memoria del proceso Next.js
- CPU durante la operación
- Throughput (MB/s)

## Output format
Archivos a crear/modificar:
```
docs/BENCHMARKS.md                    ← NUEVO
docs/benchmarks/upload-comparison.sh ← NUEVO (script)
docs/adr/ADR-002-presigned-url.md    ← ACTUALIZAR con datos
README.md                             ← ACTUALIZAR referencia a benchmarks
```

## Examples and Steps to follow
1. Elegir la decisión técnica con mayor impacto en rendimiento para medir.
2. Crear el script de benchmark reproducible.
3. Ejecutar mínimo 10 iteraciones y calcular media y percentiles.
4. Documentar las condiciones del test (hardware, red, tamaño de datos).
5. Actualizar el ADR con los resultados.
6. Crear `docs/BENCHMARKS.md` con la metodología y resultados.

## Output checklist and Guardrails
- [ ] Al menos 1 benchmark con datos reales (no estimaciones genéricas)
- [ ] Los resultados incluyen media, mínimo, máximo, o percentiles
- [ ] La metodología del benchmark está documentada (cómo reproducirlo)
- [ ] Los datos cuantitativos justifican la decisión tomada
- [ ] El ADR correspondiente fue actualizado con los números
- [ ] `docs/BENCHMARKS.md` existe y tiene los resultados
- [ ] El script o código del benchmark está disponible en el repo
- [ ] README referencia `docs/BENCHMARKS.md`
