@~/.claude/prompts/new_functionality_prompt_spec.md

# [010] Incrementar Cobertura de Tests al >60%

## Role
Act as a QA Engineer and Software Developer expert in Jest, Testing Library, and test coverage analysis for Next.js applications.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** `d:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos`  
**Issue:** `cq_cobertura_alta`  

**Pre-requisito:** Los tests mínimos deben estar implementados (`[002]_tests_minimos_unitarios_fn_prompt.md`).

El criterio requiere:
- Cobertura >60% en código de dominio
- Cobertura >40% global
- Reporte de cobertura adjunto al README o con badge

## Task
1. Habilitar la generación de reportes de cobertura en Jest.
2. Ampliar los tests existentes para cubrir más casos.
3. Generar reporte de cobertura en formato `lcov` y `text-summary`.
4. Agregar badge o link al reporte de cobertura en el README.
5. Verificar que se alcanza >60% en `lib/` y >40% global.

### [010] Guidelines
- Configurar Jest con `collectCoverage: true` y `coverageThreshold` para hacer fallar el CI si no se alcanza el mínimo.
- Coverage collectors: `['text', 'lcov', 'html']`
- Umbrales mínimos (agregar a `jest.config.ts`):
  ```ts
  coverageThreshold: {
    global: { lines: 40, functions: 40, branches: 35 },
    './lib/': { lines: 60, functions: 60, branches: 50 }
  }
  ```
- Expandir tests para cubrir:
  - `lib/auth.ts`: todos los casos de `signToken`, `verifyToken`, `hashPassword`, `comparePassword`
  - `lib/mongodb.ts`: conexión singleton
  - `app/api/videos/route.ts`: GET con query, POST con metadata
  - `app/api/auth/register/route.ts`: validación de email duplicado
  - `app/api/stream/[id]/route.ts`: byte-range proxy
- Agregar script `"test:coverage": "jest --coverage"` en `package.json`.
- El reporte HTML generado debe estar en `.gitignore` (`coverage/`).
- Badge usando Shields.io o similar; si se usa Codecov, configurar la integración.

## Output format
Archivos a crear/modificar:
```
jest.config.ts              ← ACTUALIZAR (coverage thresholds + collectors)
package.json                ← ACTUALIZAR (script test:coverage)
__tests__/                  ← AMPLIAR tests existentes
.gitignore                  ← ACTUALIZAR (coverage/ directory)
README.md                   ← ACTUALIZAR (badge de cobertura)
```

## Examples and Steps to follow
1. Actualizar `jest.config.ts` con configuración de cobertura.
2. Ejecutar `npm run test:coverage` para ver el baseline actual.
3. Identificar los módulos con menor cobertura.
4. Agregar tests para los paths no cubiertos.
5. Volver a ejecutar hasta superar los umbrales.
6. Integrar con Codecov o generar badge manual.

## Output checklist and Guardrails
- [ ] `npm run test:coverage` ejecuta sin errores
- [ ] Cobertura global >40% en líneas y funciones
- [ ] Cobertura en `lib/` >60% en líneas y funciones
- [ ] `jest.config.ts` tiene `coverageThreshold` configurado
- [ ] `coverage/` está en `.gitignore`
- [ ] README tiene badge o link al reporte de cobertura
- [ ] Los umbrales de cobertura hacen fallar el build de CI si no se alcanzan
