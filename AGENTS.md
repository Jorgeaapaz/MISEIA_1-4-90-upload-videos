<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Arquitectura:
- Frontend: Nextjs 16
- Backend: Api routes
- Storage: Rustfs (S3 compatible: endpoint http://localhost:10000/)
- Metadata: MongoDB (driver nativo, local).
- Upload: Client side directo a rustfs.
- Auth: Registro, login JWT token

Funciones:
- Subida de videos desde el cliente
- Alimentacion de metadatos en mongodb. Tags, clave-valor, descripcion, nombre, fecha
- Busqueda por metadatos, Tags, nombre, descripcion
- Reproducir videos en html5 reproductor.
- El bucket de rustfs se llama videos y se creara en caso de que no exista.
- Dashboard con informacion de videos subidos y espacio ocupado.
- Cada usuario podra ver sus propios videos

Diseño:
- Usar el skill frontend-design para realizar la landing page profesional y la mejora de las paginas.

Environment:
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=videovault
   RUSTFS_ENDPOINT=http://localhost:10000
   RUSTFS_ACCESS_KEY=minioadmin
   RUSTFS_SECRET_KEY=minioadmin1234
   RUSTFS_BUCKET=videos
   JWT_SECRET=upload-videos-dev-secret-2024