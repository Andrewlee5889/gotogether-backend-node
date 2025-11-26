import request from 'supertest';
import app from '../src/app';

const findMany = jest.fn();
const create = jest.fn();
const findUnique = jest.fn();
const update = jest.fn();
const deleteRecord = jest.fn();
const transaction = jest.fn();

jest.mock('../src/db', () => ({
  prisma: {
    contact: { findMany, create, findUnique, update, delete: deleteRecord },
    $transaction: transaction,
  },
}));

describe('Contact approval flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates pending contact request', async () => {
    create.mockResolvedValue({
      contactId: 'u2', createdAt: new Date(), status: 'PENDING',
      contact: { id: 'u2', displayName: 'Alice', email: 'alice@example.com', photoUrl: null },
      category: null,
    });

    const res = await request(app)
      .post('/api/contacts/u1')
      .send({ contactId: 'u2' });

    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'u1', contactId: 'u2', status: 'PENDING' }),
    }));
  });

  it('lists only accepted contacts', async () => {
    findMany.mockResolvedValue([
      {
        contactId: 'u2', createdAt: new Date(),
        contact: { id: 'u2', displayName: 'Alice', email: 'alice@example.com', photoUrl: null },
        category: { id: 'c1', name: 'Friends', color: '#00aaff' },
      },
    ]);

    const res = await request(app).get('/api/contacts/u1');
    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u1', status: 'ACCEPTED' },
    }));
  });

  it('lists pending incoming requests', async () => {
    findMany.mockResolvedValue([
      {
        userId: 'u2', createdAt: new Date(),
        user: { id: 'u2', displayName: 'Alice', email: 'alice@example.com', photoUrl: null },
      },
    ]);

    const res = await request(app).get('/api/contacts/u1/requests/pending');
    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { contactId: 'u1', status: 'PENDING' },
    }));
    expect(res.body[0].id).toBe('u2');
  });

  it('accepts contact request and creates reciprocal edge', async () => {
    findUnique.mockResolvedValue({ userId: 'u2', contactId: 'u1', status: 'PENDING' });
    transaction.mockResolvedValue([{}, {}]);

    const res = await request(app).post('/api/contacts/u1/requests/u2/accept');
    expect(res.status).toBe(200);
    expect(transaction).toHaveBeenCalled();
  });

  it('rejects contact request by deleting it', async () => {
    deleteRecord.mockResolvedValue({});

    const res = await request(app).post('/api/contacts/u1/requests/u2/reject');
    expect(res.status).toBe(204);
    expect(deleteRecord).toHaveBeenCalled();
  });
});
