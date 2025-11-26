import request from 'supertest';
import app from '../src/app';

// Inline mocks inside jest.mock to avoid TDZ/hoisting issues
jest.mock('../src/db', () => ({
  prisma: {
    hangout: { findMany: jest.fn() },
  },
}));

// Get a typed handle to the mocked prisma
const { prisma } = require('../src/db');

describe('GET /api/hangouts', () => {
  beforeEach(() => {
    (prisma.hangout.findMany as jest.Mock).mockReset();
    (prisma.hangout.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'h1',
        userId: 'u1',
        title: 'Lunch',
        description: null,
        location: 'Cafe',
        latitude: 37.7,
        longitude: -122.4,
        startsAt: new Date('2025-12-01T12:00:00Z'),
        endsAt: null,
        isPublic: true,
        createdAt: new Date(),
      },
    ]);
  });

  it('filters by title', async () => {
    const res = await request(app).get('/api/hangouts?title=lunch');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(prisma.hangout.findMany).toHaveBeenCalled();
    const args = ((prisma.hangout.findMany as jest.Mock).mock.calls[0] || [])[0];
    expect(args.where.title.contains).toBe('lunch');
    expect(args.orderBy.startsAt).toBe('asc');
  });
});
