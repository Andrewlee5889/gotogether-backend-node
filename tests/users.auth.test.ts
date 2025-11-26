import request from 'supertest';
import app from '../src/app';

jest.mock('../src/middleware/firebaseAuth', () => ({
  firebaseAuth: (_req: any, _res: any, next: any) => {
    (_req as any).authUser = { uid: 'firebase-uid', email: 'me@example.com', name: 'Me', picture: null };
    next();
  },
}));

const upsert = jest.fn().mockResolvedValue({
  id: 'u1', firebaseUid: 'firebase-uid', email: 'me@example.com', displayName: 'Me', photoUrl: null,
});
const findUnique = jest.fn().mockResolvedValue({ id: 'u1', firebaseUid: 'firebase-uid' });

// Inline mocks inside jest.mock to avoid TDZ/hoisting issues
jest.mock('../src/db', () => ({
  prisma: {
    user: { upsert: jest.fn(), findUnique: jest.fn() },
  },
}));

// Get a typed handle to the mocked prisma
const { prisma } = require('../src/db');

describe('Users auth endpoints', () => {
  beforeEach(() => {
    (prisma.user.upsert as jest.Mock).mockReset();
    (prisma.user.findUnique as jest.Mock).mockReset();
  });

  it('syncs user from token', async () => {
    (prisma.user.upsert as jest.Mock).mockResolvedValue({
      id: 'u1', firebaseUid: 'firebase-uid', email: 'me@example.com', displayName: 'Me', photoUrl: null,
    });
    const res = await request(app).post('/api/users/sync').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(prisma.user.upsert).toHaveBeenCalled();
    expect(res.body.firebaseUid).toBe('firebase-uid');
  });

  it('returns current user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', firebaseUid: 'firebase-uid' });
    const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { firebaseUid: 'firebase-uid' } });
  });
});
