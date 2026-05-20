import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let cached = (global as Record<string, unknown>)._mongoClientPromise as Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  if (!cached) {
    const client = new MongoClient(uri);
    cached = client.connect();
    (global as Record<string, unknown>)._mongoClientPromise = cached;
  }
  return cached;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

let indexesCreated = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesCreated) return;
  const db = await getDb();
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('videos').createIndex({ userId: 1, uploadedAt: -1 }),
    db.collection('videos').createIndex({ name: 'text', description: 'text', tags: 'text' }),
    db.collection('videos').createIndex({ tags: 1 }),
  ]);
  indexesCreated = true;
}
