import request from 'supertest';
import app from '../src/app';

const findMany = jest.fn().mockResolvedValue([
  {
    id: 'h1', userId: 'u1', title: 'Lunch', description: null, location: 'Cafe', latitude: 37.7, longitude: -122.4,
    startsAt: new Date('2025-12-01T12:00:00Z'), endsAt: null, isPublic: true, createdAt: new Date(),
  },
]);

jest.mock('../src/db', () => ({
  prisma: {
    hangout: { findMany },
  },
}));

describe('GET /api/hangouts', () => {
  it('filters by title', async () => {
    const res = await request(app).get('/api/hangouts?title=lunch');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(findMany).toHaveBeenCalled();
    const args = (findMany.mock.calls[0] || [])[0];
    expect(args.where.title.contains).toBe('lunch');
    expect(args.orderBy.startsAt).toBe('asc');
  });
});
