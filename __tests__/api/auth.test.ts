import { signToken } from '@/lib/auth';

// Mock lib/mongodb
jest.mock('@/lib/mongodb', () => require('../__mocks__/mongodb'));

import { getDb, ensureIndexes, mockCollection, mockDb } from '../__mocks__/mongodb';

// ── Helper to build a request ──────────────────────────────────────────────────
function makeRequest(method: string, body?: unknown, token?: string): Request {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost/api/auth/register', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function setupDbMocks() {
  (getDb as jest.Mock).mockResolvedValue(mockDb);
  (mockDb.collection as jest.Mock).mockReturnValue(mockCollection);
}

// ── POST /api/auth/register ────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDbMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRequest('POST', { email: 'a@b.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when password is too short', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRequest('POST', { email: 'a@b.com', name: 'User', password: '123' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 when email already exists', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ email: 'a@b.com' });
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRequest('POST', { email: 'a@b.com', name: 'User', password: 'password123' }));
    expect(res.status).toBe(409);
  });

  it('returns 201 on successful registration', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'new-id' });
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRequest('POST', { email: 'new@b.com', name: 'New User', password: 'password123' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDbMocks();
  });

  it('returns 400 when fields are missing', async () => {
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(makeRequest('POST', { email: 'a@b.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when user does not exist', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(makeRequest('POST', { email: 'noone@b.com', password: 'pass' }));
    expect(res.status).toBe(401);
  });
});
