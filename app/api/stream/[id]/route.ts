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
    // Do NOT pass request.signal: the browser cancels range-probe requests normally,
    // which would abort the S3 TCP connection mid-flight and cause ECONNRESET.
    const s3Response = await getObject(video.s3Key, range);

    const body = s3Response.Body;
    if (!body) {
      return Response.json({ error: 'Stream vacio' }, { status: 500 });
    }

    const headers: Record<string, string> = {
      'Content-Type': video.contentType,
      'Accept-Ranges': 'bytes',
    };

    if (s3Response.ContentRange) {
      headers['Content-Range'] = s3Response.ContentRange;
      // RustFS reports ContentLength = total file size even on 206 responses.
      // Derive the correct value from Content-Range (end - start + 1) instead.
      const m = s3Response.ContentRange.match(/bytes (\d+)-(\d+)\//);
      if (m) {
        headers['Content-Length'] = String(Number(m[2]) - Number(m[1]) + 1);
      }
    } else if (s3Response.ContentLength !== undefined) {
      headers['Content-Length'] = String(s3Response.ContentLength);
    }

    const status = s3Response.ContentRange ? 206 : 200;

    // Pull-based wrapper: errors from S3 (abort, reset) close the stream
    // gracefully instead of propagating as a stream error to Next.js.
    const reader = body.transformToWebStream().getReader();
    const safeStream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            try { controller.close(); } catch { /* already closed */ }
          } else {
            controller.enqueue(value);
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
