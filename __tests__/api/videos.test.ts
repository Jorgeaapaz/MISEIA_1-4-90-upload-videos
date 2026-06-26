import { signToken } from '@/lib/auth';

const userId = 'aaaaaaaaaaaaaaaaaaaaaaaa'; // valid 24-char hex ObjectId string
const validToken = signToken({ userId, email: 'user@test.com', name: 'Test User' });

// ── Lightweight ObjectId mock (avoids ts-jest CJS/ESM interop issue with mongodb) ─
jest.mock('mongodb', () => {
  class MockObjectId {
    id: string;
    constructor(id?: string) { this.id = id ?? '000000000000000000000000'; }
    toString() { return this.id; }
    toHexString() { return this.id; }
    equals(other: MockObjectId) { return this.id === other.id; }
  }
  return { ObjectId: MockObjectId };
});

// ── Inline mock factory ────────────────────────────────────────────────────────
const mockInsertOne = jest.fn();
const mockCountDocuments = jest.fn();
const mockToArray = jest.fn();
const mockCollection = {
  find: jest.fn(() => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: mockToArray,
  })),
  insertOne: mockInsertOne,
  countDocuments: mockCountDocuments,
};
const mockDb = { collection: jest.fn(() => mockCollection) };

jest.mock('@/lib/mongodb', () => ({
  getDb: jest.fn().mockResolvedValue({
    collection: jest.fn(() => mockCollection),
  }),
  ensureIndexes: jest.fn().mockResolvedValue(undefined),
}));

// ── Helper to build a request ──────────────────────────────────────────────────
function makeRequest(method: string, url: string, body?: unknown, token?: string): Request {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── GET /api/videos ────────────────────────────────────────────────────────────
describe('GET /api/videos', () => {
  beforeEach(() => {
    mockToArray.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);
  });

  it('[debug] mock is wired', async () => {
    const { getDb } = require('@/lib/mongodb');
    const db = await getDb();
    const coll = db.collection('videos');
    const chain = coll.find({});
    const arr = await chain.sort({}).skip(0).limit(10).toArray();
    const cnt = await coll.countDocuments({});
    expect(arr).toEqual([]);
    expect(cnt).toBe(0);
  });
  it('returns 401 when unauthenticated', async () => {
    const { GET } = await import('@/app/api/videos/route');
    const res = await GET(makeRequest('GET', 'http://localhost/api/videos'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with empty list when no videos', async () => {
    const { GET } = await import('@/app/api/videos/route');
    const res = await GET(makeRequest('GET', 'http://localhost/api/videos', undefined, validToken));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.videos)).toBe(true);
    expect(body.total).toBe(0);
  });
});

// ── POST /api/videos ───────────────────────────────────────────────────────────
describe('POST /api/videos', () => {
  beforeEach(() => {
    mockInsertOne.mockResolvedValue({ insertedId: 'bbbbbbbbbbbbbbbbbbbbbbbb' });
  });

  it('returns 401 when unauthenticated', async () => {
    const { POST } = await import('@/app/api/videos/route');
    const res = await POST(makeRequest('POST', 'http://localhost/api/videos', {}));
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/videos/route');
    const res = await POST(makeRequest('POST', 'http://localhost/api/videos', { name: 'test' }, validToken));
    expect(res.status).toBe(400);
  });

  it('returns 201 on valid video creation', async () => {
    const { POST } = await import('@/app/api/videos/route');
    const res = await POST(makeRequest('POST', 'http://localhost/api/videos', {
      name: 'My Video',
      s3Key: 'videos/abc123.mp4',
      contentType: 'video/mp4',
      size: 1024000,
      description: 'Test video',
      tags: ['test'],
    }, validToken));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('My Video');
  });
});
