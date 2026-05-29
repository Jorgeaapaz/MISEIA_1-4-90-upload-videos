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

    // Parse the start byte from the browser's Range header.
    // Always request a capped range so RustFS never has to deliver large payloads.
    const rangeHeader = request.headers.get('Range');
    let start = 0;
    if (rangeHeader) {
      const m = rangeHeader.match(/bytes=(\d+)-/);
      if (m) start = Number(m[1]);
    }

    // 512 KB per chunk — smaller than 1 MB to reduce RustFS connection stress.
    const MAX_CHUNK = 512 * 1024;
    const requestedEnd = start + MAX_CHUNK - 1;

    // Fetch the chunk with up to 3 retries. RustFS resets connections at its
    // internal 8 MB object-chunk boundary; a short back-off and retry recovers.
    let buffer!: Uint8Array;
    let sContentRange: string | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 100 * attempt));
      try {
        const s3Response = await getObject(video.s3Key, `bytes=${start}-${requestedEnd}`);
        if (!s3Response.Body) throw new Error('Empty body');
        buffer = await s3Response.Body.transformToByteArray();
        sContentRange = s3Response.ContentRange;
        lastError = undefined;
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (lastError) throw lastError;

    const actualLength = buffer.byteLength;
    const actualEnd = start + actualLength - 1;

    // Derive totalSize from the RustFS Content-Range response header.
    // Fall back to video.size only if Content-Range is absent.
    let totalSize = video.size;
    if (sContentRange) {
      const m = sContentRange.match(/\/(\d+)$/);
      if (m) totalSize = Number(m[1]);
    }

    return new Response(buffer, {
      status: 206,
      headers: {
        'Content-Type': video.contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(actualLength),
        'Content-Range': `bytes ${start}-${actualEnd}/${totalSize}`,
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? `${err.message} (code: ${(err as NodeJS.ErrnoException).code ?? 'none'})` : String(err);
    console.error('[stream] error:', detail);
    return Response.json({ error: 'Error obteniendo stream', detail }, { status: 500 });
  }
}
