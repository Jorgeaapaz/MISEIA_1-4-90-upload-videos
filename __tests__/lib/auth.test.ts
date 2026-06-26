import { signToken, verifyToken, hashPassword, comparePassword, extractToken, authenticateRequest } from '@/lib/auth';

describe('lib/auth — signToken / verifyToken', () => {
  const payload = { userId: 'abc123', email: 'user@example.com', name: 'Test User' };

  it('signs a token and returns a string', () => {
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('verifies a valid token and returns the payload', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
  });

  it('throws on an invalid token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow();
  });

  it('throws on a tampered token', () => {
    const token = signToken(payload);
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(() => verifyToken(tampered)).toThrow();
  });
});

describe('lib/auth — hashPassword / comparePassword', () => {
  it('hashes a password and returns a bcrypt hash', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it('comparePassword returns true for correct password', async () => {
    const hash = await hashPassword('correcthorse');
    const result = await comparePassword('correcthorse', hash);
    expect(result).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const hash = await hashPassword('correcthorse');
    const result = await comparePassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('two hashes of the same password are different (salt)', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
  });
});

describe('lib/auth — extractToken', () => {
  it('extracts token from Authorization Bearer header', () => {
    const req = new Request('http://localhost/test', {
      headers: { Authorization: 'Bearer mytoken123' },
    });
    expect(extractToken(req)).toBe('mytoken123');
  });

  it('returns null if no Authorization header', () => {
    const req = new Request('http://localhost/test');
    expect(extractToken(req)).toBeNull();
  });

  it('returns null for non-Bearer Authorization', () => {
    const req = new Request('http://localhost/test', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(extractToken(req)).toBeNull();
  });

  it('extracts token from Cookie header', () => {
    const req = new Request('http://localhost/test', {
      headers: { Cookie: 'token=cookietoken; other=value' },
    });
    expect(extractToken(req)).toBe('cookietoken');
  });
});

describe('lib/auth — authenticateRequest', () => {
  const payload = { userId: 'user1', email: 'a@b.com', name: 'User' };

  it('returns payload for a valid token', () => {
    const token = signToken(payload);
    const req = new Request('http://localhost/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = authenticateRequest(req);
    expect(result?.userId).toBe(payload.userId);
  });

  it('returns null for a missing token', () => {
    const req = new Request('http://localhost/test');
    expect(authenticateRequest(req)).toBeNull();
  });

  it('returns null for an invalid token', () => {
    const req = new Request('http://localhost/test', {
      headers: { Authorization: 'Bearer invalid.token.data' },
    });
    expect(authenticateRequest(req)).toBeNull();
  });
});
