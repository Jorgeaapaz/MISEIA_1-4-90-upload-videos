@~/.claude/prompts/new_functionality_prompt_spec.md

# [002] Implementar Tests Mínimos Automatizados

## Role
Act as a Software Developer and QA Engineer expert in Next.js, Jest, Testing Library, and API integration testing.

## Context
**Proyecto:** VideoVault — Next.js 16, MongoDB, RustFS, JWT Auth  
**Repositorio:** `d:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos`  
**Issue:** `cq_tests_minimos`  

El proyecto **no tiene ningún test automatizado**. No existe configuración de Jest ni de ningún framework de testing. Los flujos críticos son:
- Autenticación: registro, login, validación JWT
- Upload presign: generación de URL presignada
- Videos CRUD: listar, crear, obtener, eliminar
- Dashboard stats: estadísticas de usuario

## Task
1. Instalar y configurar Jest con ts-jest para TypeScript.
2. Crear tests unitarios para las utilidades de `lib/`:
   - `lib/auth.ts`: `signToken`, `verifyToken`, `comparePassword`, `hashPassword`
3. Crear tests de integración para las API routes críticas (usando mocks de MongoDB y S3):
   - `POST /api/auth/register` — registro válido e inválido
   - `POST /api/auth/login` — login correcto, credenciales inválidas
   - `GET /api/videos` — lista de videos autenticado vs sin token
   - `POST /api/videos` — crear video con metadata
   - `GET /api/dashboard/stats` — estadísticas de usuario
4. Agregar script `"test": "jest"` al `package.json`.
5. Documentar en README cómo ejecutar los tests.

### [002] Guidelines
- Usar **Jest** con **ts-jest** para soporte TypeScript nativo.
- Para API routes de Next.js 16 (App Router), usar `@testing-library/react` + mocks de `next/server`.
- Mockear MongoDB con `mongodb-memory-server` o con jest mocks manuales.
- Mockear el cliente S3 (RustFS) con jest mocks en `lib/s3.ts`.
- Los tests deben ser ejecutables con `npm test` sin necesidad de MongoDB o RustFS corriendo.
- Cubrir al menos: happy path + al menos 1 caso de error por endpoint crítico.
- Estructura de tests: `__tests__/` en la raíz o al lado de cada módulo.

## Output format
Archivos a crear/modificar:
```
jest.config.ts          ← NUEVO
jest.setup.ts           ← NUEVO (si hace falta)
__tests__/
  lib/
    auth.test.ts        ← NUEVO
  api/
    auth.test.ts        ← NUEVO
    videos.test.ts      ← NUEVO
    dashboard.test.ts   ← NUEVO
package.json            ← ACTUALIZAR scripts + devDependencies
README.md               ← ACTUALIZAR sección de tests
```

## Examples and Steps to follow
1. Instalar dependencias: `npm install -D jest ts-jest @types/jest jest-environment-node mongodb-memory-server`.
2. Configurar `jest.config.ts` con `preset: 'ts-jest'`, `testEnvironment: 'node'`, paths de módulos.
3. Crear mock para `lib/mongodb.ts` y `lib/s3.ts`.
4. Escribir tests para `lib/auth.ts` primero (más simples, sin dependencias externas).
5. Escribir tests de API routes usando `Request`/`Response` nativo de Node 18+.
6. Verificar que `npm test` pasa sin errores.

## Output checklist and Guardrails
- [ ] `npm test` ejecuta sin errores y todos los tests pasan
- [ ] Al menos 8 tests en total cubriendo los flujos críticos
- [ ] Tests no requieren servicios externos reales (MongoDB/RustFS mockeados)
- [ ] `jest.config.ts` commiteado con configuración estable
- [ ] README actualizado con `npm test` como comando de verificación
- [ ] No se exponen credenciales reales en archivos de test
