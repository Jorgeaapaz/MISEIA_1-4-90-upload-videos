import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import { getObject, headObject } from '@/lib/s3';
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

    // Authoritative file size from RustFS (do not trust video.size in MongoDB).
    const head = await headObject(video.s3Key);
    const totalSize = head.ContentLength;
    if (totalSize === undefined) {
      return Response.json({ error: 'No se pudo determinar el tamano del video' }, { status: 500 });
    }

    // Parse browser Range header against the authoritative size.
    const rangeHeader = request.headers.get('Range');
    let start = 0;
    let end = totalSize - 1;
    let isRange = false;

    if (rangeHeader) {
      const m = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (m) {
        start = Number(m[1]);
        end = m[2] ? Math.min(Number(m[2]), totalSize - 1) : totalSize - 1;
        if (start >= totalSize || end < start) {
          return new Response(null, {
            status: 416,
            headers: { 'Content-Range': `bytes */${totalSize}` },
          });
        }
        isRange = true;
      }
    }

    // Cap each range response at 2 MB. The browser issues subsequent
    // Range requests for the next chunks as it plays.
    const MAX_CHUNK = 2 * 1024 * 1024;
    if (end - start + 1 > MAX_CHUNK) {
      end = start + MAX_CHUNK - 1;
      isRange = true;
    }

    const s3Response = await getObject(video.s3Key, `bytes=${start}-${end}`);
    const body = s3Response.Body;
    if (!body) {
      return Response.json({ error: 'Stream vacio' }, { status: 500 });
    }

    // Buffer the slice fully and derive Content-Length from the actual byte
    // count so headers cannot lie about the payload size.
    const buffer = await body.transformToByteArray();
    const actualLength = buffer.byteLength;
    const actualEnd = start + actualLength - 1;

    const headers: Record<string, string> = {
      'Content-Type': video.contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(actualLength),
      'Cache-Control': 'no-store',
    };

    if (isRange) {
      headers['Content-Range'] = `bytes ${start}-${actualEnd}/${totalSize}`;
    }

    const status = isRange ? 206 : 200;

    return new Response(buffer, { status, headers });
  } catch (err) {
    console.error('[stream] error:', err);
    return Response.json({ error: 'Error obteniendo stream' }, { status: 500 });
  }
}
