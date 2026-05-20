import { getDb } from '@/lib/mongodb';
import { comparePassword, signToken } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email y contrasena son requeridos' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection<User>('users').findOne({ email });

    if (!user) {
      return Response.json({ error: 'Credenciales invalidas' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return Response.json({ error: 'Credenciales invalidas' }, { status: 401 });
    }

    const token = signToken({
      userId: user._id!.toString(),
      email: user.email,
      name: user.name,
    });

    return Response.json({
      token,
      user: {
        id: user._id!.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
