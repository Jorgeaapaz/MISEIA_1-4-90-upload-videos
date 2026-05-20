import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function GET(request: Request) {
  const payload = authenticateRequest(request);
  if (!payload) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(payload.userId) });

    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return Response.json({
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
