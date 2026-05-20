import { getDb, ensureIndexes } from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return Response.json({ error: 'Email, nombre y contrasena son requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'La contrasena debe tener al menos 6 caracteres' }, { status: 400 });
    }

    await ensureIndexes();
    const db = await getDb();

    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return Response.json({ error: 'El email ya esta registrado' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    await db.collection('users').insertOne({
      email,
      name,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return Response.json({ success: true }, { status: 201 });
  } catch {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
