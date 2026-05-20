import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import { getObject } from '@/lib/s3';
import type { VideoMetadata } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = authenticateRequest(request);
  if (!payload) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: 'ID invalido' }, { status: 400 });
    }

    const db = await getDb();
    const video = await db.collection<VideoMetadata>('videos').findOne({ _id: new ObjectId(id) });

    if (!video) {
      return Response.json({ error: 'Video no encontrado' }, { status: 404 });
    }

    if (video.userId.toString() !== payload.userId) {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    const range = request.headers.get('Range') || undefined;
    const s3Response = await getObject(video.s3Key, range);

    const headers: Record<string, string> = {
      'Content-Type': video.contentType,
      'Accept-Ranges': 'bytes',
    };

    if (s3Response.ContentLength !== undefined) {
      headers['Content-Length'] = String(s3Response.ContentLength);
    }

    if (s3Response.ContentRange) {
      headers['Content-Range'] = s3Response.ContentRange;
    }

    const status = s3Response.ContentRange ? 206 : 200;

    return new Response(s3Response.Body as ReadableStream, { status, headers });
  } catch {
    return Response.json({ error: 'Error obteniendo stream' }, { status: 500 });
  }
}
