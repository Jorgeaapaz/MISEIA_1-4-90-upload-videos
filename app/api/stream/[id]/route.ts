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

    // Parse the browser's Range header. Compute all values ourselves using
    // video.size from MongoDB — never trust what RustFS reports in its headers.
    const rangeHeader = request.headers.get('Range');
    let start = 0;
    let end = video.size - 1;
    let isRange = false;

    if (rangeHeader) {
      const m = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (m) {
        start = Number(m[1]);
        end = m[2] ? Math.min(Number(m[2]), video.size - 1) : video.size - 1;
        isRange = true;
      }
    }

    const chunkSize = end - start + 1;

    const s3Response = await getObject(
      video.s3Key,
      isRange ? `bytes=${start}-${end}` : undefined,
    );

    const body = s3Response.Body;
    if (!body) {
      return Response.json({ error: 'Stream vacio' }, { status: 500 });
    }

    // Build headers entirely from our own values — not from s3Response headers.
    const headers: Record<string, string> = {
      'Content-Type': video.contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunkSize),
    };

    if (isRange) {
      headers['Content-Range'] = `bytes ${start}-${end}/${video.size}`;
    }

    const status = isRange ? 206 : 200;

    // Stream exactly chunkSize bytes. Truncates any excess that RustFS may send
    // (known RustFS bug: sometimes returns the full file body for range requests).
    const reader = body.transformToWebStream().getReader();
    let delivered = 0;
    const safeStream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (delivered >= chunkSize) {
          try { controller.close(); } catch { /* already closed */ }
          return;
        }
        try {
          const { done, value } = await reader.read();
          if (done) {
            try { controller.close(); } catch { /* already closed */ }
            return;
          }
          let chunk = value;
          if (delivered + chunk.byteLength > chunkSize) {
            chunk = chunk.slice(0, chunkSize - delivered);
          }
          delivered += chunk.byteLength;
          controller.enqueue(chunk);
          if (delivered >= chunkSize) {
            try { controller.close(); } catch { /* already closed */ }
          }
        } catch {
          try { controller.close(); } catch { /* already closed */ }
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(safeStream, { status, headers });
  } catch {
    return Response.json({ error: 'Error obteniendo stream' }, { status: 500 });
  }
}
