import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import { getPresignedDownloadUrl } from '@/lib/s3';
import type { VideoMetadata } from '@/lib/types';

// RustFS bug: any range request with start >= 8 MB returns 206 with 0 bytes,
// regardless of end position. Only ranges starting before 8 MB work (even
// those that cross the boundary). The full-object GET (no Range) is fine.
//
// Fix for start >= 8 MB: fetch the full object once, cache it in module
// memory, and serve all subsequent chunks from the cache. In dev the server
// process is long-lived, so the cache persists across requests.
const RUSTFS_BOUNDARY = 8 * 1024 * 1024;
const MAX_CHUNK = 512 * 1024;

const videoCache = new Map<string, Uint8Array>();

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

    if (start >= RUSTFS_BOUNDARY) {
      // Any range starting at or past 8 MB returns 0 bytes from RustFS.
      // Fetch the full object once and serve all post-boundary chunks from
      // the in-memory cache.
      if (!videoCache.has(video.s3Key)) {
        const resp = await fetch(presignedUrl);
        if (!resp.ok) throw new Error(`RustFS full-object fetch: ${resp.status}`);
        videoCache.set(video.s3Key, new Uint8Array(await resp.arrayBuffer()));
      }
      const data = videoCache.get(video.s3Key)!;
      totalSize = data.byteLength;
      buffer = data.subarray(start, Math.min(start + MAX_CHUNK, data.byteLength));
    } else {
      // start < 8 MB: normal range request.
      const cappedEnd = start + MAX_CHUNK - 1;
      const resp = await fetch(presignedUrl, {
        headers: { Range: `bytes=${start}-${cappedEnd}` },
      });
      if (!resp.ok && resp.status !== 206) {
        throw new Error(`RustFS range fetch: ${resp.status}`);
      }
      buffer = new Uint8Array(await resp.arrayBuffer());
      const cr = resp.headers.get('content-range');
      if (cr) { const m = cr.match(/\/(\d+)$/); if (m) totalSize = Number(m[1]); }
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
