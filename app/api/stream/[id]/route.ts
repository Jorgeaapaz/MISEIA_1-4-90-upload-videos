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

    // RustFS always resets the connection when a range request starts exactly
    // on its internal 8 MB object-chunk boundary. Shift the S3 request back
    // by 1 byte and strip it from the buffer so the browser receives the
    // correct data at the correct offset.
    const RUSTFS_BOUNDARY = 8 * 1024 * 1024;
    const trimBytes = (start > 0 && start % RUSTFS_BOUNDARY === 0) ? 1 : 0;
    const adjustedStart = start - trimBytes;
    const requestedEnd = adjustedStart + MAX_CHUNK - 1;

    const s3Response = await getObject(video.s3Key, `bytes=${adjustedStart}-${requestedEnd}`);
    if (!s3Response.Body) throw new Error('Empty body');
    const raw = await s3Response.Body.transformToByteArray();
    const buffer = trimBytes > 0 ? raw.subarray(trimBytes) : raw;
    const sContentRange = s3Response.ContentRange;

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
