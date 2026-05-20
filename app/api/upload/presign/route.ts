import { authenticateRequest } from '@/lib/auth';
import { getPresignedUploadUrl } from '@/lib/s3';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const payload = authenticateRequest(request);
  if (!payload) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return Response.json({ error: 'fileName y contentType son requeridos' }, { status: 400 });
    }

    if (!contentType.startsWith('video/')) {
      return Response.json({ error: 'Solo se permiten archivos de video' }, { status: 400 });
    }

    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${payload.userId}/${randomUUID()}-${sanitized}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    return Response.json({ uploadUrl, key });
  } catch {
    return Response.json({ error: 'Error generando URL de subida' }, { status: 500 });
  }
}
