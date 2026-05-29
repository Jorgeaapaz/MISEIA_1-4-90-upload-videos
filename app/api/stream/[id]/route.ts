import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import { getPresignedDownloadUrl } from '@/lib/s3';
import type { VideoMetadata } from '@/lib/types';

// RustFS bug: range requests that start at or after an internal chunk boundary
// terminate the connection (or return 0 bytes) instead of serving data. The
// boundary offset varies per file. Full-object GET always works.
//
// Strategy:
//  1. Try a capped range request.
//  2. If it throws (connection terminated) or returns empty body, fall back:
//     fetch the full object once and cache it in module memory.
//  3. Subsequent requests for the same video slice from the cache directly.
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

    if (videoCache.has(video.s3Key)) {
      // Already cached from a previous boundary hit — serve from memory.
      const data = videoCache.get(video.s3Key)!;
      totalSize = data.byteLength;
      buffer = data.subarray(start, Math.min(start + MAX_CHUNK, data.byteLength));
    } else {
      // Cap end to video.size-1 to avoid requesting past EOF.
      const cappedEnd = Math.min(start + MAX_CHUNK - 1, video.size - 1);

      let needsCache = false;
      let raw: Uint8Array | null = null;
      let contentRange: string | null = null;

      try {
        const resp = await fetch(presignedUrl, {
          headers: { Range: `bytes=${start}-${cappedEnd}` },
        });
        if (!resp.ok && resp.status !== 206) {
          throw new Error(`RustFS range fetch: ${resp.status}`);
        }
        const bytes = new Uint8Array(await resp.arrayBuffer());
        if (bytes.byteLength === 0) {
          // RustFS returned 206 with empty body — boundary hit.
          needsCache = true;
        } else {
          raw = bytes;
          contentRange = resp.headers.get('content-range');
        }
      } catch (e) {
        // Connection terminated by RustFS at a chunk boundary.
        // Re-throw only if this is not a transport-level error.
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.startsWith('RustFS range fetch:')) throw e;
        needsCache = true;
      }

      if (needsCache) {
        // Fetch the full object once and cache it for all future chunks.
        const fullResp = await fetch(presignedUrl);
        if (!fullResp.ok) throw new Error(`RustFS full-object fetch: ${fullResp.status}`);
        videoCache.set(video.s3Key, new Uint8Array(await fullResp.arrayBuffer()));
        const data = videoCache.get(video.s3Key)!;
        totalSize = data.byteLength;
        buffer = data.subarray(start, Math.min(start + MAX_CHUNK, data.byteLength));
      } else {
        buffer = raw!;
        if (contentRange) {
          const m = contentRange.match(/\/(\d+)$/);
          if (m) totalSize = Number(m[1]);
        }
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
