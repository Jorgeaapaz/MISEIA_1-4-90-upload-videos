import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const payload = authenticateRequest(request);
  if (!payload) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const userId = new ObjectId(payload.userId);

    const [countResult, sizeResult, recentVideos, tagDistribution] = await Promise.all([
      db.collection('videos').countDocuments({ userId }),
      db.collection('videos').aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } },
      ]).toArray(),
      db.collection('videos')
        .find({ userId })
        .sort({ uploadedAt: -1 })
        .limit(5)
        .toArray(),
      db.collection('videos').aggregate([
        { $match: { userId } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { tag: '$_id', count: 1, _id: 0 } },
      ]).toArray(),
    ]);

    return Response.json({
      totalVideos: countResult,
      totalSize: sizeResult[0]?.totalSize || 0,
      recentVideos,
      tagDistribution,
    });
  } catch {
    return Response.json({ error: 'Error obteniendo estadisticas' }, { status: 500 });
  }
}
