import request from 'supertest';
import app from '../src/app';

jest.mock('../src/db', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ now: new Date().toISOString() }]),
  },
}));

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.time).toBeDefined();
  });
});
