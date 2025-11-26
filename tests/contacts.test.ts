import request from 'supertest';
import app from '../src/app';

// Inline mocks inside jest.mock to avoid TDZ/hoisting issues
jest.mock('../src/db', () => ({
  prisma: {
    contact: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Get a typed handle to the mocked prisma
const { prisma } = require('../src/db');

describe('Contact approval flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.contact.findMany as jest.Mock).mockReset();
    (prisma.contact.create as jest.Mock).mockReset();
    (prisma.contact.findUnique as jest.Mock).mockReset();
    (prisma.contact.update as jest.Mock).mockReset();
    (prisma.contact.delete as jest.Mock).mockReset();
    (prisma.$transaction as jest.Mock).mockReset();
  });

  it('creates pending contact request', async () => {
    (prisma.contact.create as jest.Mock).mockResolvedValue({
      contactId: 'u2', createdAt: new Date(), status: 'PENDING',
      contact: { id: 'u2', displayName: 'Alice', email: 'alice@example.com', photoUrl: null },
      category: null,
    });

    const res = await request(app)
      .post('/api/contacts/u1')
      .send({ contactId: 'u2' });

    expect(res.status).toBe(201);
    expect(prisma.contact.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'u1', contactId: 'u2', status: 'PENDING' }),
    }));
  });

  it('lists only accepted contacts', async () => {
    (prisma.contact.findMany as jest.Mock).mockResolvedValue([
      {
        contactId: 'u2', createdAt: new Date(),
        contact: { id: 'u2', displayName: 'Alice', email: 'alice@example.com', photoUrl: null },
        category: { id: 'c1', name: 'Friends', color: '#00aaff' },
      },
    ]);

    const res = await request(app).get('/api/contacts/u1');
    expect(res.status).toBe(200);
    expect(prisma.contact.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u1', status: 'ACCEPTED' },
    }));
  });

  it('lists pending incoming requests', async () => {
    (prisma.contact.findMany as jest.Mock).mockResolvedValue([
      {
        userId: 'u2', createdAt: new Date(),
        user: { id: 'u2', displayName: 'Alice', email: 'alice@example.com', photoUrl: null },
      },
    ]);

    const res = await request(app).get('/api/contacts/u1/requests/pending');
    expect(res.status).toBe(200);
    expect(prisma.contact.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { contactId: 'u1', status: 'PENDING' },
    }));
    expect(res.body[0].id).toBe('u2');
  });

  it('accepts contact request and creates reciprocal edge', async () => {
    (prisma.contact.findUnique as jest.Mock).mockResolvedValue({ userId: 'u2', contactId: 'u1', status: 'PENDING' });
    (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

    const res = await request(app).post('/api/contacts/u1/requests/u2/accept');
    expect(res.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects contact request by deleting it', async () => {
    (prisma.contact.delete as jest.Mock).mockResolvedValue({});

    const res = await request(app).post('/api/contacts/u1/requests/u2/reject');
    expect(res.status).toBe(204);
    expect(prisma.contact.delete).toHaveBeenCalled();
  });
});
