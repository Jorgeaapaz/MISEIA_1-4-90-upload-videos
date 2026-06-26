import { signToken } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';

const userId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const validToken = signToken({ userId, email: 'user@test.com', name: 'Test User' });

// Mock mongodb and mongodb (for ObjectId)
jest.mock('mongodb', () => ({
  ObjectId: class MockObjectId {
    id: string;
    static isValid(id: string) { return /^[0-9a-fA-F]{24}$/.test(id); }
    constructor(id?: string) { this.id = id ?? '000000000000000000000000'; }
    toString() { return this.id; }
  },
}));

const mockFindOne = jest.fn();
const mockDeleteOne = jest.fn();
const mockInsertOne = jest.fn();
const mockCollection = {
  findOne: mockFindOne,
  deleteOne: mockDeleteOne,
  insertOne: mockInsertOne,
};
jest.mock('@/lib/mongodb', () => ({
  getDb: jest.fn().mockResolvedValue({ collection: jest.fn(() => mockCollection) }),
  ensureIndexes: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/s3', () => ({
  deleteObject: jest.fn().mockResolvedValue(undefined),
}));

function makeRequest(method: string, url: string, token?: string): Request {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request(url, { method, headers });
}

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockResolvedValue({ collection: jest.fn(() => mockCollection) });
  });

  it('returns 401 when unauthenticated', async () => {
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET(makeRequest('GET', 'http://localhost/api/auth/me'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET(makeRequest('GET', 'http://localhost/api/auth/me', validToken));
    expect(res.status).toBe(404);
  });

  it('returns 200 with user data when found', async () => {
    mockFindOne.mockResolvedValueOnce({
      _id: { toString: () => userId },
      email: 'user@test.com',
      name: 'Test User',
      createdAt: new Date(),
    });
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET(makeRequest('GET', 'http://localhost/api/auth/me', validToken));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('user@test.com');
  });
});

// ── GET /api/videos/[id] ───────────────────────────────────────────────────────
describe('GET /api/videos/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockResolvedValue({ collection: jest.fn(() => mockCollection) });
  });

  const validId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
  const params = Promise.resolve({ id: validId });

  it('returns 401 when unauthenticated', async () => {
    const { GET } = await import('@/app/api/videos/[id]/route');
    const res = await GET(makeRequest('GET', `http://localhost/api/videos/${validId}`), { params });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid id', async () => {
    const { GET } = await import('@/app/api/videos/[id]/route');
    const badParams = Promise.resolve({ id: 'invalid' });
    const res = await GET(
      makeRequest('GET', 'http://localhost/api/videos/invalid', validToken),
      { params: badParams }
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when video not found', async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/videos/[id]/route');
    const res = await GET(
      makeRequest('GET', `http://localhost/api/videos/${validId}`, validToken),
      { params }
    );
    expect(res.status).toBe(404);
  });

  it('returns 200 with video when found and owned', async () => {
    mockFindOne.mockResolvedValueOnce({
      _id: { toString: () => validId },
      userId: { toString: () => userId },
      name: 'My Video',
      s3Key: 'videos/test.mp4',
    });
    const { GET } = await import('@/app/api/videos/[id]/route');
    const res = await GET(
      makeRequest('GET', `http://localhost/api/videos/${validId}`, validToken),
      { params }
    );
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/videos/[id] ────────────────────────────────────────────────────
describe('DELETE /api/videos/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockResolvedValue({ collection: jest.fn(() => mockCollection) });
  });

  const validId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
  const params = Promise.resolve({ id: validId });

  it('returns 401 when unauthenticated', async () => {
    const { DELETE } = await import('@/app/api/videos/[id]/route');
    const res = await DELETE(makeRequest('DELETE', `http://localhost/api/videos/${validId}`), { params });
    expect(res.status).toBe(401);
  });

  it('returns 200 when video is deleted', async () => {
    mockFindOne.mockResolvedValueOnce({
      _id: { toString: () => validId },
      userId: { toString: () => userId },
      s3Key: 'videos/test.mp4',
    });
    mockDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    const { DELETE } = await import('@/app/api/videos/[id]/route');
    const res = await DELETE(
      makeRequest('DELETE', `http://localhost/api/videos/${validId}`, validToken),
      { params }
    );
    expect(res.status).toBe(200);
  });
});
