# PERT Compliance Plan — VideoVault (upload-videos)

**Proyecto:** VideoVault — Video Upload & Management Platform  
**Fecha:** 2026-06-26  

---

## PERT Compliance Plan

El siguiente plan organiza las tareas de corrección en orden lógico de dependencias. Las tareas independientes pueden ejecutarse en paralelo. Las tareas con dependencias deben ejecutarse en el orden indicado.

### Nodos del PERT

```
[START]
   │
   ├──► T1: .env.example  ──────────────────────────────────────────► [T7]
   │
   ├──► T2: Tests mínimos  ─────────────────────────────────────────► [T4, T5]
   │
   ├──► T3: Dockerfile + instrucciones deploy  ─────────────────────► [T4, T5, T6]
   │
   ├──► T7: Diagrama de arquitectura  ──────────────────────────────► [T8]
   ├──► T8: Decisiones documentadas  ───────────────────────────────► [T9]
   ├──► T9: Cambios IA documentados  ───────────────────────────────► [END-DOC]
   │
   ├──► [T2 + T3] ──► T4: CI/CD GitHub  ───────────────────────────► [T6]
   ├──► [T2 + T3] ──► T5: CI/CD GitLab  ───────────────────────────► [T6]
   │
   ├──► [T4 ó T5 + T3] ──► T6: Deploy público accesible ──────────► [END-FUNC]
   │
   ├──► T10: Cobertura tests alta (>60%)  ──────────────────────────► [END-QA]
   ├──► T11: ADRs / Decision Log  ──────────────────────────────────► [END-ARCH]
   └──► T12: Justificación cuantitativa  ───────────────────────────► [END-ARCH]
```

### Ruta Crítica

```
START → T2 (Tests) → T4 (CI GitHub) → T6 (Deploy público) → END
```

Ruta alternativa de documentación:
```
START → T3 (Dockerfile) → T4/T5 (CI) → T6 (Deploy) → END
```

---

### Lista PERT Ordenada

#### Fase 1 — Fundamentos (Independientes, Paralelas)

**T1 — Crear `.env.example` con todas las variables de entorno**  
Tarea independiente de baja duración. Impacta directamente `dc_env_example` y `cq_sin_secretos_en_repo`.  
→ Ref: [`[001]_env_example_template_fn_prompt.md`](./[001]_env_example_template_fn_prompt.md)

**T2 — Implementar tests mínimos automatizados**  
Requisito previo para CI/CD funcional. Cubrir los flujos críticos: auth, upload presign, video CRUD.  
→ Ref: [`[002]_tests_minimos_unitarios_fn_prompt.md`](./[002]_tests_minimos_unitarios_fn_prompt.md)

**T3 — Crear Dockerfile e instrucciones de deploy de producción**  
Requisito previo para CI/CD y deploy público. Dockerfile multi-stage, docker-compose de app.  
→ Ref: [`[003]_instrucciones_deploy_dockerfile_fn_prompt.md`](./[003]_instrucciones_deploy_dockerfile_fn_prompt.md)

#### Fase 2 — CI/CD (Depende de T2 + T3)

**T4 — Configurar pipeline CI/CD en GitHub Actions**  
Depende de T2 (tests) y T3 (Dockerfile). Compila, testea y despliega en GCP VM via SSH.  
→ Ref: [`[004]_ci_pipeline_github_fn_prompt.md`](./[004]_ci_pipeline_github_fn_prompt.md)

**T5 — Configurar pipeline CI/CD en GitLab CI**  
Alternativa a T4. Mismas dependencias. Usar si el repo migra a GitLab.  
→ Ref: [`[005]_ci_pipeline_gitlab_fn_prompt.md`](./[005]_ci_pipeline_gitlab_fn_prompt.md)

#### Fase 3 — Deploy público (Depende de T3 + T4 ó T5)

**T6 — Deploy público accesible en GCP VM con dominio documentado**  
Depende de Dockerfile (T3) y CI/CD (T4 ó T5). Deploy en `videovault.deviaaps.com`.  
→ Ref: [`[006]_deploy_publico_accesible_fn_prompt.md`](./[006]_deploy_publico_accesible_fn_prompt.md)

#### Fase 4 — Documentación (Paralelas entre sí)

**T7 — Agregar diagrama de arquitectura Mermaid al README**  
Independiente. Diagrama de componentes: Next.js ↔ MongoDB ↔ RustFS.  
→ Ref: [`[007]_diagrama_arquitectura_fn_prompt.md`](./[007]_diagrama_arquitectura_fn_prompt.md)

**T8 — Documentar decisiones técnicas y trade-offs**  
Depende de T7 (contexto visual). Sección "Decisiones" con ≥2 trade-offs reales.  
→ Ref: [`[008]_decisiones_documentadas_fn_prompt.md`](./[008]_decisiones_documentadas_fn_prompt.md)

**T9 — Documentar uso de IA y cambios realizados**  
Independiente. Sección `docs/AI_USAGE.md` con revisión crítica.  
→ Ref: [`[009]_cambios_ia_documentados_fn_prompt.md`](./[009]_cambios_ia_documentados_fn_prompt.md)

#### Fase 5 — Mejoras opcionales / Excepcionales

**T10 — Incrementar cobertura de tests al >60%**  
Depende de T2. Agregar tests de integración y medir cobertura con badge.  
→ Ref: [`[010]_cobertura_tests_alta_fn_prompt.md`](./[010]_cobertura_tests_alta_fn_prompt.md)

**T11 — Crear ADRs (Architecture Decision Records)**  
Independiente. Documentar decisiones clave en `docs/adr/`.  
→ Ref: [`[011]_adrs_decision_log_fn_prompt.md`](./[011]_adrs_decision_log_fn_prompt.md)

**T12 — Justificación cuantitativa de decisiones técnicas**  
Depende de T8. Añadir benchmarks o comparaciones a las decisiones documentadas.  
→ Ref: [`[012]_justificacion_cuantitativa_fn_prompt.md`](./[012]_justificacion_cuantitativa_fn_prompt.md)

---

## Execution PERT

Tabla de ejecución en orden PERT (considerando la ruta crítica y paralelismo):

| # | Tarea | ID Criterio | Prompt File | Depende de | Prioridad | Paralela con |
|---|---|---|---|---|---|---|
| 1 | Crear `.env.example` | `dc_env_example` | [`[001]`](`[001]_env_example_template_fn_prompt.md`) | — | 🔴 Alta | T2, T3, T7, T9 |
| 2 | Implementar tests mínimos | `cq_tests_minimos` | [`[002]`](`[002]_tests_minimos_unitarios_fn_prompt.md`) | — | 🔴 Alta | T1, T3, T7, T9 |
| 3 | Dockerfile + instrucciones deploy | `dc_instrucciones_deploy` | [`[003]`](`[003]_instrucciones_deploy_dockerfile_fn_prompt.md`) | — | 🔴 Alta | T1, T2, T7, T9 |
| 4 | Diagrama de arquitectura Mermaid | `dc_diagrama_arquitectura` | [`[007]`](`[007]_diagrama_arquitectura_fn_prompt.md`) | — | 🟡 Media | T1, T2, T3 |
| 5 | Documentar uso de IA | `dc_cambios_ia_documentados` | [`[009]`](`[009]_cambios_ia_documentados_fn_prompt.md`) | — | 🟡 Media | T1, T2, T3 |
| 6 | CI/CD GitHub Actions | `cq_ci_funcional` | [`[004]`](`[004]_ci_pipeline_github_fn_prompt.md`) | T2, T3 | 🟠 Media-Alta | T5 |
| 7 | CI/CD GitLab CI | `cq_ci_funcional` | [`[005]`](`[005]_ci_pipeline_gitlab_fn_prompt.md`) | T2, T3 | 🟠 Media-Alta | T4 |
| 8 | Decisiones documentadas | `dc_decisiones_documentadas` | [`[008]`](`[008]_decisiones_documentadas_fn_prompt.md`) | T4 (diag) | 🟡 Media | — |
| 9 | Deploy público accesible | `fn_deploy_publico_accesible` | [`[006]`](`[006]_deploy_publico_accesible_fn_prompt.md`) | T3, T6 | 🟠 Media-Alta | — |
| 10 | Cobertura tests alta (>60%) | `cq_cobertura_alta` | [`[010]`](`[010]_cobertura_tests_alta_fn_prompt.md`) | T2 | 🟡 Media | T8 |
| 11 | ADRs / Decision Log | `dc_adrs_o_decision_log` | [`[011]`](`[011]_adrs_decision_log_fn_prompt.md`) | T8 | 🟢 Baja | T10, T12 |
| 12 | Justificación cuantitativa | `dc_justificacion_cuantitativa` | [`[012]`](`[012]_justificacion_cuantitativa_fn_prompt.md`) | T8 | 🟢 Baja | T11 |

---

*Generado automáticamente — 2026-06-26*
