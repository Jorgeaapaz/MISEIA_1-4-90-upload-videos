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

    // Get the authoritative file size directly from RustFS (HEAD).
    // Do NOT trust video.size from MongoDB — it can drift from the actual stored object.
    const head = await headObject(video.s3Key);
    const totalSize = head.ContentLength;
    if (totalSize === undefined) {
      return Response.json({ error: 'No se pudo determinar el tamano del video' }, { status: 500 });
    }

    // Parse the browser's Range header against the authoritative size.
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

    const chunkSize = end - start + 1;

    const s3Response = await getObject(video.s3Key, `bytes=${start}-${end}`);
    const body = s3Response.Body;
    if (!body) {
      return Response.json({ error: 'Stream vacio' }, { status: 500 });
    }

    // Build headers entirely from our own values; ignore RustFS response headers.
    const headers: Record<string, string> = {
      'Content-Type': video.contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunkSize),
      'Cache-Control': 'no-store',
    };

    if (isRange) {
      headers['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
    }

    const status = isRange ? 206 : 200;

    // Stream exactly chunkSize bytes:
    // - If S3 sends more, truncate the tail.
    // - If S3 sends less (or errors), pad the deficit with zero bytes so the byte
    //   count matches Content-Length. Better to deliver a slightly garbled tail
    //   than to trigger ERR_CONTENT_LENGTH_MISMATCH and break <video> entirely.
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
            const deficit = chunkSize - delivered;
            if (deficit > 0) {
              controller.enqueue(new Uint8Array(deficit));
              delivered += deficit;
            }
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
          const deficit = chunkSize - delivered;
          if (deficit > 0) {
            try {
              controller.enqueue(new Uint8Array(deficit));
              delivered += deficit;
            } catch { /* controller already errored */ }
          }
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
