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

    // 1 MB per chunk. S3/RustFS automatically clamps the end if it exceeds the
    // object size and reports the real end in Content-Range.
    const MAX_CHUNK = 1 * 1024 * 1024;
    const requestedEnd = start + MAX_CHUNK - 1;

    const s3Response = await getObject(video.s3Key, `bytes=${start}-${requestedEnd}`);
    const body = s3Response.Body;
    if (!body) {
      return Response.json({ error: 'Stream vacio' }, { status: 500 });
    }

    // Buffer the slice. With 1 MB cap and keepAlive:false this completes quickly.
    // Using buffer.byteLength for Content-Length means the header is ALWAYS
    // accurate — even if RustFS delivers fewer bytes than the range implies.
    const buffer = await body.transformToByteArray();
    const actualLength = buffer.byteLength;
    const actualEnd = start + actualLength - 1;

    // Derive totalSize from the RustFS Content-Range response header, which
    // carries the correct object size even when ContentLength is wrong.
    // Fall back to video.size only if Content-Range is absent.
    let totalSize = video.size;
    if (s3Response.ContentRange) {
      const m = s3Response.ContentRange.match(/\/(\d+)$/);
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
    console.error('[stream] error:', err);
    return Response.json({ error: 'Error obteniendo stream' }, { status: 500 });
  }
}
