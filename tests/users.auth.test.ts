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

jest.mock('../src/db', () => ({
  prisma: {
    user: { upsert, findUnique },
  },
}));

describe('Users auth endpoints', () => {
  it('syncs user from token', async () => {
    const res = await request(app).post('/api/users/sync').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalled();
    expect(res.body.firebaseUid).toBe('firebase-uid');
  });

  it('returns current user', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(findUnique).toHaveBeenCalledWith({ where: { firebaseUid: 'firebase-uid' } });
  });
});
