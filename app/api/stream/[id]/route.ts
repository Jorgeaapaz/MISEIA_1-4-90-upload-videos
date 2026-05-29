import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
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

    // HEAD for authoritative size from RustFS. video.size in MongoDB cannot be
    // trusted (the upload may have stored fewer/more bytes than file.size).
    const head = await headObject(video.s3Key);
    const totalSize = head.ContentLength;
    if (totalSize === undefined || totalSize <= 0) {
      return Response.json({ error: 'No se pudo determinar el tamano' }, { status: 500 });
    }

    // Parse the browser Range header against the authoritative size.
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

    const s3Response = await getObject(video.s3Key, `bytes=${start}-${end}`);
    const body = s3Response.Body;
    if (!body) {
      return Response.json({ error: 'Stream vacio' }, { status: 500 });
    }

    // Cap every response to 1 MB. Chrome cancels large open-ended range requests
    // once it has buffered enough to start playback — if Content-Length promised
    // more bytes than it consumed, the browser reports ERR_CONTENT_LENGTH_MISMATCH.
    // Serving small self-contained chunks means Chrome always consumes every
    // promised byte before requesting the next chunk.
    const MAX_CHUNK = 1 * 1024 * 1024;
    if (end - start + 1 > MAX_CHUNK) {
      end = start + MAX_CHUNK - 1;
      isRange = true;
    }

    const chunkSize = end - start + 1;

    // Content-Length is required by Chrome's <video> element for 206 responses.
    const headers: Record<string, string> = {
      'Content-Type': video.contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunkSize),
    };

    if (isRange) {
      headers['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
    }

    const status = isRange ? 206 : 200;

    // Stream directly from RustFS to the client via Node Readable events.
    // Bytes flow as they arrive, so the browser does not cancel out of impatience.
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
            closed = true;
            nodeStream.destroy();
          }
        });
        nodeStream.on('end', safeClose);
        nodeStream.on('close', safeClose);
        nodeStream.on('error', safeClose);
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new Response(webStream, { status, headers });
  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || (err as NodeJS.ErrnoException).code === 'ECONNRESET')) {
      return new Response(null, { status: 499 });
    }
    console.error('[stream] error:', err);
    return Response.json({ error: 'Error obteniendo stream' }, { status: 500 });
  }
}
