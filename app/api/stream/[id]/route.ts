import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import { getPresignedDownloadUrl } from '@/lib/s3';
import type { VideoMetadata } from '@/lib/types';

// RustFS internal object-chunk size. Range requests that start at or cross
// this boundary cause ECONNRESET / connection termination. We work around it
// by (a) never letting a chunk cross the boundary and (b) falling back to a
// full-object stream + byte-skip for requests that start exactly at one.
const RUSTFS_BOUNDARY = 8 * 1024 * 1024;
const MAX_CHUNK = 512 * 1024;

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

    const rangeHeader = request.headers.get('Range');
    let start = 0;
    if (rangeHeader) {
      const m = rangeHeader.match(/bytes=(\d+)-/);
      if (m) start = Number(m[1]);
    }

    const presignedUrl = await getPresignedDownloadUrl(video.s3Key);

    let buffer: Uint8Array;
    let totalSize = video.size;

    const isBoundaryStart = start > 0 && start % RUSTFS_BOUNDARY === 0;

    if (isBoundaryStart) {
      // RustFS cannot serve range requests starting at its internal 8 MB chunk
      // boundary. Fetch the full object sequentially and skip to the offset.
      const resp = await fetch(presignedUrl);
      if (!resp.ok) throw new Error(`RustFS full-object fetch: ${resp.status}`);

      const reader = resp.body!.getReader();
      const chunks: Uint8Array[] = [];
      let skipped = 0;
      let buffered = 0;

      try {
        while (buffered < MAX_CHUNK) {
          const { done, value } = await reader.read();
          if (done) break;

          if (skipped < start) {
            const toSkip = Math.min(value.byteLength, start - skipped);
            skipped += toSkip;
            if (toSkip < value.byteLength) {
              const useful = value.subarray(toSkip);
              const take = Math.min(useful.byteLength, MAX_CHUNK - buffered);
              chunks.push(useful.subarray(0, take));
              buffered += take;
            }
          } else {
            const take = Math.min(value.byteLength, MAX_CHUNK - buffered);
            chunks.push(value.subarray(0, take));
            buffered += take;
          }
        }
      } finally {
        reader.cancel().catch(() => {});
      }

      buffer = new Uint8Array(buffered);
      let off = 0;
      for (const c of chunks) { buffer.set(c, off); off += c.byteLength; }

    } else {
      // Normal case: cap the chunk so it never crosses an 8 MB boundary.
      const nextBoundary = (Math.floor(start / RUSTFS_BOUNDARY) + 1) * RUSTFS_BOUNDARY;
      const cappedEnd = Math.min(start + MAX_CHUNK - 1, nextBoundary - 1);

      const resp = await fetch(presignedUrl, {
        headers: { Range: `bytes=${start}-${cappedEnd}` },
      });
      if (!resp.ok && resp.status !== 206) {
        throw new Error(`RustFS range fetch: ${resp.status}`);
      }
      buffer = new Uint8Array(await resp.arrayBuffer());
      const cr = resp.headers.get('content-range');
      if (cr) {
        const m = cr.match(/\/(\d+)$/);
        if (m) totalSize = Number(m[1]);
      }
    }

    const actualLength = buffer.byteLength;
    const actualEnd = start + actualLength - 1;

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
