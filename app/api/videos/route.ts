import { ObjectId } from 'mongodb';
import { getDb, ensureIndexes } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import type { VideoMetadata } from '@/lib/types';

export async function POST(request: Request) {
  const payload = authenticateRequest(request);
  if (!payload) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, description, tags, metadata, fileName, s3Key, contentType, size } = await request.json();

    if (!name || !s3Key || !contentType || !size) {
      return Response.json({ error: 'Campos requeridos: name, s3Key, contentType, size' }, { status: 400 });
    }

    await ensureIndexes();
    const db = await getDb();

    const video: Omit<VideoMetadata, '_id'> = {
      userId: new ObjectId(payload.userId),
      name,
      description: description || '',
      tags: tags || [],
      metadata: metadata || {},
      fileName: fileName || name,
      s3Key,
      contentType,
      size: Number(size),
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('videos').insertOne(video);

    return Response.json({ ...video, _id: result.insertedId }, { status: 201 });
  } catch {
    return Response.json({ error: 'Error guardando metadatos' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const payload = authenticateRequest(request);
  if (!payload) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const tagsParam = searchParams.get('tags');
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));

    await ensureIndexes();
    const db = await getDb();

    const filter: Record<string, unknown> = { userId: new ObjectId(payload.userId) };

    if (q) {
      filter.$text = { $search: q };
    }

    if (tagsParam) {
      const tagsArray = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
      if (tagsArray.length > 0) {
        filter.tags = { $in: tagsArray };
      }
    }

    const [videos, total] = await Promise.all([
      db.collection<VideoMetadata>('videos')
        .find(filter)
        .sort({ uploadedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection('videos').countDocuments(filter),
    ]);

    return Response.json({
      videos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return Response.json({ error: 'Error obteniendo videos' }, { status: 500 });
  }
}
