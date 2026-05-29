import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
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

    const totalSize = video.size;

    // Parse browser Range header.
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

    const headers: Record<string, string> = {
      'Content-Type': video.contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunkSize),
    };

    if (isRange) {
      headers['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
    }

    const status = isRange ? 206 : 200;

    // Stream directly from RustFS to the client. Use the Node Readable directly
    // (the SDK Body is a Node Readable) and convert to a Web ReadableStream that
    // swallows abort/reset errors silently — the browser cancelling a video
    // range probe is normal and should not generate server errors.
    const nodeStream = body as Readable;
    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;
        const safeClose = () => {
          if (closed) return;
          closed = true;
          try { controller.close(); } catch { /* already closed */ }
        };
        nodeStream.on('data', (chunk: Buffer) => {
          if (closed) return;
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch {
            // Controller may be closed if the client disconnected.
            closed = true;
            nodeStream.destroy();
          }
        });
        nodeStream.on('end', safeClose);
        nodeStream.on('close', safeClose);
        nodeStream.on('error', () => {
          // RustFS / network errors during streaming: close the response
          // gracefully instead of bubbling up as a 500.
          safeClose();
        });
      },
      cancel() {
        // Client disconnected: tear down the upstream read.
        nodeStream.destroy();
      },
    });

    return new Response(webStream, { status, headers });
  } catch (err) {
    // Truly unexpected errors only — by this point the response has not started.
    if (err instanceof Error && (err.name === 'AbortError' || (err as NodeJS.ErrnoException).code === 'ECONNRESET')) {
      return new Response(null, { status: 499 });
    }
    console.error('[stream] error:', err);
    return Response.json({ error: 'Error obteniendo stream' }, { status: 500 });
  }
}
