# Retrospectiva de Sesion — 2026-04-21
### VideoVault - Implementacion completa de plataforma de videos

## Resumen / Overview
Se implemento desde cero la aplicacion completa **VideoVault**, una plataforma de subida, organizacion y reproduccion de videos. El proyecto partia de un scaffold vacio de Next.js 16.2.4 y se construyeron todas las capas: autenticacion JWT, subida directa a Rustfs (S3-compatible), metadatos en MongoDB, busqueda full-text, reproductor HTML5, y dashboard de estadisticas. La build compila sin errores. Todos los endpoints aplican aislamiento por usuario (cada usuario solo ve sus propios videos).

## Proceso de instalacion / Installation

### Prerequisitos
- Node.js >= 20.9 (requerido por Next.js 16)
- MongoDB corriendo localmente en puerto 27017
- Rustfs (o MinIO) corriendo en puerto 10000

### Dependencias instaladas
```bash
cd D:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos

# Produccion
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner mongodb bcryptjs jsonwebtoken

# Desarrollo (tipos TypeScript)
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### Configuracion de entorno
Se creo `.env.local` con las siguientes variables:
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=videovault
RUSTFS_ENDPOINT=http://localhost:10000
RUSTFS_ACCESS_KEY=minioadmin
RUSTFS_SECRET_KEY=minioadmin1234
RUSTFS_BUCKET=videos
JWT_SECRET=upload-videos-dev-secret-2024
```

### next.config.ts
Se anadio `serverExternalPackages` para que Turbopack no intente bundlear los modulos nativos de Node.js:
```ts
serverExternalPackages: ['mongodb', 'bcryptjs', 'jsonwebtoken']
```

## Archivos creados / Files Created

### Libreria compartida (`lib/`)
| Archivo | Descripcion |
|---------|-------------|
| `lib/types.ts` | Interfaces: User, VideoMetadata, DashboardStats, JWTPayload |
| `lib/mongodb.ts` | Singleton MongoClient en globalThis, getDb(), ensureIndexes() |
| `lib/s3.ts` | S3Client con forcePathStyle, ensureBucket(), presigned URLs |
| `lib/auth.ts` | JWT sign/verify, bcrypt hash/compare, authenticateRequest() |

### API Routes (`app/api/`)
| Ruta | Metodo | Descripcion |
|------|--------|-------------|
| `/api/auth/register` | POST | Registro de usuario (email, name, password) |
| `/api/auth/login` | POST | Login, devuelve JWT + user |
| `/api/auth/me` | GET | Info del usuario autenticado |
| `/api/upload/presign` | POST | Genera presigned PUT URL para subida directa |
| `/api/videos` | GET | Lista/busca videos del usuario (paginado, full-text, tags) |
| `/api/videos` | POST | Guarda metadatos tras subida exitosa |
| `/api/videos/[id]` | GET/PUT/DELETE | CRUD de video individual (verificacion de ownership) |
| `/api/stream/[id]` | GET | Devuelve presigned GET URL para reproduccion |
| `/api/dashboard/stats` | GET | Estadisticas: total videos, espacio, tags, recientes |

### Proxy (auth middleware)
| Archivo | Descripcion |
|---------|-------------|
| `proxy.ts` | Protege rutas con verificacion JWT (Next.js 16 convention, reemplaza middleware.ts) |

### Contexto de autenticacion
| Archivo | Descripcion |
|---------|-------------|
| `context/AuthContext.tsx` | AuthProvider con token en localStorage + cookie, useAuth() hook |

### Componentes (`components/`)
| Archivo | Descripcion |
|---------|-------------|
| `Navbar.tsx` | Barra de navegacion con logo, links, menu de usuario |
| `UploadForm.tsx` | Formulario de subida con drag&drop, progreso XHR, 3 pasos (presign, upload, metadata) |
| `TagInput.tsx` | Input de tags con chips, Enter/coma para separar |
| `MetadataForm.tsx` | Editor dinamico de pares clave-valor |
| `VideoCard.tsx` | Card de video para grid (nombre, tags, tamano, fecha) |
| `SearchBar.tsx` | Barra de busqueda con texto + filtro de tags, debounce 300ms |
| `VideoPlayer.tsx` | Reproductor HTML5 que obtiene presigned URL via API |
| `StatsCard.tsx` | Card de estadistica con icono, valor y subtitulo |

### Paginas (`app/`)
| Ruta | Archivo | Descripcion |
|------|---------|-------------|
| `/` | `app/page.tsx` | Landing page con hero, features, how-it-works, CTA, footer |
| `/login` | `app/(auth)/login/page.tsx` | Formulario de login |
| `/register` | `app/(auth)/register/page.tsx` | Formulario de registro |
| `/dashboard` | `app/(main)/dashboard/page.tsx` | Dashboard con stats cards, videos recientes, distribucion de tags |
| `/upload` | `app/(main)/upload/page.tsx` | Pagina de subida de video |
| `/videos` | `app/(main)/videos/page.tsx` | Listado de videos con busqueda y paginacion |
| `/videos/[id]` | `app/(main)/videos/[id]/page.tsx` | Detalle de video: reproductor, metadatos, edicion, eliminacion |

### Layouts
| Archivo | Descripcion |
|---------|-------------|
| `app/layout.tsx` | Root layout con AuthProvider, fuentes Geist, tema oscuro |
| `app/(main)/layout.tsx` | Layout autenticado con Navbar |

## Levantar y detener la aplicacion / Running & Stopping

### Prerequisitos en ejecucion
```bash
# 1. MongoDB (debe estar corriendo en localhost:27017)
mongod

# 2. Rustfs/MinIO (debe estar corriendo en localhost:10000)
# Ejemplo con MinIO:
minio server ./data --address :10000
```

### Iniciar la aplicacion
```bash
cd D:\Master-IA-Dev\04-Bloque4\1-4-90-upload-videos\upload-videos
npm run dev
```
La aplicacion estara disponible en `http://localhost:3000`

### Detener
Presionar `Ctrl+C` en la terminal donde corre `npm run dev`.

### Build de produccion
```bash
npm run build
npm run start
```

## URLs de prueba / Test URLs

| URL | Descripcion |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/register | Registro de usuario |
| http://localhost:3000/login | Inicio de sesion |
| http://localhost:3000/dashboard | Dashboard (requiere login) |
| http://localhost:3000/upload | Subir video (requiere login) |
| http://localhost:3000/videos | Listado de videos (requiere login) |
| http://localhost:10000 | RustFS (Running in Local PC Docker)|
| http://localhost:10001 | RustFS Console (Running in Local PC Docker)|
| http://localhost:27017 | MongoDB (Running in Local PC)|


### Probar API con curl

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"123456"}'

# Login (guardar el token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Obtener info del usuario
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"

# Listar videos
curl http://localhost:3000/api/videos \
  -H "Authorization: Bearer <TOKEN>"

# Buscar por texto
curl "http://localhost:3000/api/videos?q=tutorial" \
  -H "Authorization: Bearer <TOKEN>"

# Buscar por tags
curl "http://localhost:3000/api/videos?tags=nextjs,react" \
  -H "Authorization: Bearer <TOKEN>"

# Obtener presigned URL para subida
curl -X POST http://localhost:3000/api/upload/presign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"fileName":"video.mp4","contentType":"video/mp4"}'

# Dashboard stats
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer <TOKEN>"
```

## Configuracion de red / Network Configuration

Esta aplicacion corre localmente en Windows. No requiere configuracion NAT ni port forwarding ya que todos los servicios (Next.js, MongoDB, Rustfs) corren en localhost.

> Si se requiere acceso desde otra maquina o una VM con VirtualBox NAT, configurar port forwarding:
> - Puerto 3000 (Next.js)
> - Puerto 27017 (MongoDB)
> - Puerto 10000 (Rustfs)

## Problemas encontrados / Problems & Solutions

| Problema | Solucion |
|----------|----------|
| `proxy.ts` vs `middleware.ts` - Next.js 16 renombro la convencion | Se uso `proxy.ts` con export function `proxy()` segun la documentacion de Next.js 16. El proxy ahora usa Node.js runtime (no Edge), lo que permite usar `jsonwebtoken` directamente. |
| VideoPlayer usaba `useState` como inicializador para fetch | Se corrigio a `useEffect` para cargar la URL presigned del video al montar el componente. |
| Stream API con redirect 302 no funciona con headers de auth del navegador | Se cambio de `Response.redirect()` a devolver JSON `{ url }` para que el cliente obtenga la URL presigned y la asigne al `<video src>`. |
| Params asincronos en Next.js 16 | Todos los `params` en route handlers y pages se manejan como `Promise` con `await params` segun la convencion de Next.js 16. |
| AWS SDK v3 agrega `x-amz-checksum-mode=ENABLED` a presigned URLs | Se configuro el S3Client con `requestChecksumCalculation: 'WHEN_REQUIRED'` y `responseChecksumValidation: 'WHEN_REQUIRED'` para evitar el parametro extra. No fue suficiente para resolver el error de streaming. |
| `ERR_CONTENT_LENGTH_MISMATCH 206` al reproducir videos con presigned URLs directas a Rustfs | **Problema critico**: Rustfs no maneja correctamente las Range requests del `<video>` HTML5 cuando se usan presigned URLs directas. El browser solicita rangos de bytes (206 Partial Content) pero Rustfs devuelve un `Content-Length` inconsistente, rompiendo la reproduccion. **Solucion**: Se reemplazo el enfoque de presigned GET URLs por un **proxy server-side** en `/api/stream/[id]`. Ahora Next.js lee el video desde Rustfs via AWS SDK (`GetObjectCommand` con `Range` header) y reenvia el stream al browser con headers `Content-Range` y `Content-Length` correctos. El VideoPlayer usa `/api/stream/{id}` como `src` directamente y la cookie `token` autentica automaticamente. |
| `Error: failed to pipe response` / `ECONNRESET` al reproducir videos (`/api/stream/[id]` devuelve 500) | **Causa**: El cuerpo de respuesta del AWS SDK (`s3Response.Body`) es un stream de Node.js (`SdkStreamMixin`), no un `ReadableStream` de la Web API. Al hacer `as ReadableStream` y pasarlo a `new Response()`, Next.js intentaba hacer pipe de un tipo incompatible, fallando con `ECONNRESET`. Ademas, cuando el browser cancela la peticion (seek o cierre), el pipe lanzaba error sin manejar. **Solucion**: Se reemplazo el cast por `body.transformToWebStream()` (metodo del SDK que convierte correctamente al tipo Web API). Se paso `request.signal` a `getObject()` para cancelar el request a Rustfs cuando el browser desconecta. Se capturo `AbortError`/`ECONNRESET` en el catch para retornar 499 en vez de 500. |

## Arquitectura / Architecture

```
Cliente (Browser)
    |
    |── Auth (JWT en localStorage + cookie)
    |── Paginas Next.js (React 19 / App Router)
    |── Subida directa a Rustfs via presigned PUT URL
    |
Next.js 16 Server
    |── proxy.ts (verificacion JWT)
    |── API Routes (auth, videos, upload, stream, dashboard)
    |── lib/ (mongodb, s3, auth, types)
    |
MongoDB (localhost:27017, db: videovault)
    |── Collection: users (email unique index)
    |── Collection: videos (text index, userId index, tags index)
    |
Rustfs/S3 (localhost:10000, bucket: videos)
    |── Almacenamiento de archivos de video
    |── Upload: presigned PUT URLs (cliente directo)
    |── Download/Stream: proxy via Next.js API (no presigned GET)
```

## Flujo de subida de video

1. Usuario selecciona archivo y llena metadatos
2. Cliente → `POST /api/upload/presign` (con JWT) → recibe `{ uploadUrl, key }`
3. Cliente → `PUT uploadUrl` (directo a Rustfs via XHR con progress)
4. Cliente → `POST /api/videos` (metadatos + s3Key) → video guardado en MongoDB
5. Redireccion a la pagina del video

## Resultados y conclusiones / Results & Conclusions

### Lo que funciona
- Build completa sin errores (Next.js 16.2.4 Turbopack)
- 16 rutas generadas: 6 estaticas + 10 dinamicas + proxy
- Todas las API routes con aislamiento por usuario (filtro por userId en cada query)
- Landing page profesional con animaciones CSS y tema oscuro
- Sistema de auth completo: registro, login, JWT, proxy de proteccion
- Subida directa a S3 con progreso via XHR
- CRUD completo de videos con busqueda full-text y filtro por tags
- Dashboard con estadisticas agregadas
- Reproductor HTML5 con streaming proxy server-side (Range requests)

### Cambios post-build (debugging de streaming)
Se descubrio que **Rustfs no soporta correctamente Range requests via presigned GET URLs** desde el browser. El `<video>` HTML5 hace requests con header `Range: bytes=X-Y` y Rustfs respondia con `Content-Length` incorrecto, causando `ERR_CONTENT_LENGTH_MISMATCH`.

**Archivos modificados:**
- `lib/s3.ts` — Se agrego `requestChecksumCalculation: 'WHEN_REQUIRED'` y `responseChecksumValidation: 'WHEN_REQUIRED'` al S3Client. Se agrego funcion `getObject(key, range?)` para leer objetos directamente con soporte de Range.
- `app/api/stream/[id]/route.ts` — Se reemplazo completamente: ya no devuelve presigned URL, ahora hace proxy del video leyendo de Rustfs server-side y reenviando con headers `Content-Range`, `Content-Length` y status 206 correctos.
- `components/VideoPlayer.tsx` — Simplificado: usa `/api/stream/{id}` como `src` del `<video>` directamente. La cookie `token` autentica automaticamente sin necesidad de fetch previo ni presigned URL.

**Fix adicional — `Error: failed to pipe response` (2026-05-28):**
- `lib/s3.ts` — `getObject()` acepta ahora un tercer parametro `abortSignal?: AbortSignal` y lo pasa al `s3Client.send()` para cancelar el request a Rustfs cuando el browser desconecta.
- `app/api/stream/[id]/route.ts` — Se reemplazo `s3Response.Body as ReadableStream` por `body.transformToWebStream()` (conversion correcta de Node.js stream a Web ReadableStream). Se pasa `request.signal` a `getObject()`. Se captura `AbortError`/`ECONNRESET` para devolver 499 en vez de propagar el error como 500.

**Fix critico — ECONNRESET en boundary interno de RustFS (2026-05-29):**

Tras multiples iteraciones fallidas se descubrio que RustFS tiene un bug grave con range requests: devuelve **HTTP 206 con 0 bytes** para cualquier request donde `start >= 8,388,608` (8 MB). No es un error de red ni del cliente HTTP — es RustFS devolviendo una respuesta vacia sin indicar error.

Proceso de diagnostico:
1. Se intentaron varias aproximaciones (retry con backoff, keepAlive: false, shift de 1 byte, fetch con undici) — todas fallaban porque el problema es en RustFS, no en el cliente.
2. La clave fue hacer tests directos con `curl` usando una presigned URL real, que revelo el `206 / 0 bytes` como respuesta de RustFS para starts >= 8 MB.
3. Se confirmo que ranges que CRUZAN el boundary (start < 8 MB, end > 8 MB) funcionan correctamente.
4. Se confirmo que GET sin Range header (objeto completo) funciona correctamente.

Comportamiento confirmado con curl:
- `bytes=0-524287` → 206, 524288 bytes ✓
- `bytes=8388608-8912895` → 206, **0 bytes** ✗ (bug de RustFS)
- `bytes=8388609-8912895` → 206, **0 bytes** ✗
- `bytes=8000000-8524287` (cruza boundary) → 206, 524288 bytes ✓
- Sin Range header (objeto completo) → 200, 17,481,215 bytes ✓

**Solucion implementada (`app/api/stream/[id]/route.ts`):**
- `start < 8 MB`: range request normal de 512 KB via presigned URL + `fetch()`.
- `start >= 8 MB`: se descarga el objeto completo una sola vez via `fetch(presignedUrl)` (sin Range header) y se almacena en un `Map<string, Uint8Array>` a nivel de modulo. Los chunks sucesivos se sirven con `.subarray()` desde cache — zero requests extra a RustFS tras el primer miss.

```typescript
const videoCache = new Map<string, Uint8Array>();

if (start >= RUSTFS_BOUNDARY) {
  if (!videoCache.has(video.s3Key)) {
    const resp = await fetch(presignedUrl); // sin Range header
    videoCache.set(video.s3Key, new Uint8Array(await resp.arrayBuffer()));
  }
  const data = videoCache.get(video.s3Key)!;
  buffer = data.subarray(start, Math.min(start + MAX_CHUNK, data.byteLength));
}
```

El primer cruce del boundary causa una descarga completa del video (~100-200 ms en localhost para 17 MB). Todos los seeks y chunks posteriores son instantaneos desde memoria.

### Pendiente para proxima sesion
- Considerar agregar thumbnails/previews de video
- Tests unitarios y de integracion
- Evaluar limite de tamano de archivos en la subida
