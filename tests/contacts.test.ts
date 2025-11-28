import request from 'supertest';
import app from '../src/app';
import { testPrisma, cleanDatabase, disconnectDatabase, createTestUser } from './helpers/db';

describe('Contacts API - Integration Tests', () => {
  let user1: any;
  let user2: any;
  let user3: any;
  let category1: any;

  beforeEach(async () => {
    await cleanDatabase();
    
    // Seed test users
    user1 = await createTestUser({
      firebaseUid: 'user1-uid',
      email: 'user1@test.com',
      displayName: 'User One',
    });
    
    user2 = await createTestUser({
      firebaseUid: 'user2-uid',
      email: 'user2@test.com',
      displayName: 'User Two',
    });
    
    user3 = await createTestUser({
      firebaseUid: 'user3-uid',
      email: 'user3@test.com',
      displayName: 'User Three',
    });

    // Create a test category
    category1 = await testPrisma.contactCategory.create({
      data: { userId: user1.id, name: 'Friends', color: '#00aaff' },
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /api/contacts/:userId', () => {
    it('creates pending contact request', async () => {
      const res = await request(app)
        .post(`/api/contacts/${user1.id}`)
        .send({ contactId: user2.id });

      // Verify HTTP response
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: user2.id,
        displayName: 'User Two',
        email: 'user2@test.com',
        photoUrl: null,
        category: null,
      });
      expect(res.body.createdAt).toBeDefined();

      // Verify database state
      const contact = await testPrisma.contact.findUnique({
        where: { userId_contactId: { userId: user1.id, contactId: user2.id } },
      });
      expect(contact).toBeTruthy();
      expect(contact?.status).toBe('PENDING');
      expect(contact?.categoryId).toBeNull();
    });

    it('creates contact with category assignment', async () => {
      const res = await request(app)
        .post(`/api/contacts/${user1.id}`)
        .send({ contactId: user2.id, categoryId: category1.id });

      expect(res.status).toBe(201);
      expect(res.body.category).toMatchObject({
        id: category1.id,
        name: 'Friends',
        color: '#00aaff',
      });

      const contact = await testPrisma.contact.findUnique({
        where: { userId_contactId: { userId: user1.id, contactId: user2.id } },
      });
      expect(contact?.categoryId).toBe(category1.id);
    });

    it('rejects duplicate contact request', async () => {
      await testPrisma.contact.create({
        data: { userId: user1.id, contactId: user2.id, status: 'PENDING' },
      });

      const res = await request(app)
        .post(`/api/contacts/${user1.id}`)
        .send({ contactId: user2.id });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already');
    });

    it('rejects self-contact', async () => {
      const res = await request(app)
        .post(`/api/contacts/${user1.id}`)
        .send({ contactId: user1.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('yourself');
    });
  });

  describe('GET /api/contacts/:userId', () => {
    it('lists only accepted contacts', async () => {
      // Create one PENDING and two ACCEPTED contacts
      await testPrisma.contact.create({
        data: { userId: user1.id, contactId: user2.id, status: 'PENDING' },
      });
      await testPrisma.contact.create({
        data: { userId: user1.id, contactId: user3.id, status: 'ACCEPTED', categoryId: category1.id },
      });

      const res = await request(app).get(`/api/contacts/${user1.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: user3.id,
        displayName: 'User Three',
        email: 'user3@test.com',
        category: {
          id: category1.id,
          name: 'Friends',
          color: '#00aaff',
        },
      });
    });

    it('returns empty array when no accepted contacts', async () => {
      const res = await request(app).get(`/api/contacts/${user1.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/contacts/:userId/requests/pending', () => {
    it('lists incoming pending requests', async () => {
      // user2 and user3 send requests TO user1
      await testPrisma.contact.create({
        data: { userId: user2.id, contactId: user1.id, status: 'PENDING' },
      });
      await testPrisma.contact.create({
        data: { userId: user3.id, contactId: user1.id, status: 'PENDING' },
      });

      const res = await request(app).get(`/api/contacts/${user1.id}/requests/pending`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      
      const userIds = res.body.map((r: any) => r.id).sort();
      expect(userIds).toEqual([user2.id, user3.id].sort());
      
      expect(res.body[0]).toMatchObject({
        displayName: expect.any(String),
        email: expect.stringContaining('@test.com'),
      });
    });

    it('does not include accepted contacts', async () => {
      await testPrisma.contact.create({
        data: { userId: user2.id, contactId: user1.id, status: 'ACCEPTED' },
      });

      const res = await request(app).get(`/api/contacts/${user1.id}/requests/pending`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/contacts/:userId/requests/:contactId/accept', () => {
    it('accepts contact request and creates reciprocal edge', async () => {
      // user2 sends request TO user1
      await testPrisma.contact.create({
        data: { userId: user2.id, contactId: user1.id, status: 'PENDING' },
      });

      const res = await request(app)
        .post(`/api/contacts/${user1.id}/requests/${user2.id}/accept`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('accepted');

      // Verify both edges exist and are ACCEPTED
      const originalRequest = await testPrisma.contact.findUnique({
        where: { userId_contactId: { userId: user2.id, contactId: user1.id } },
      });
      expect(originalRequest?.status).toBe('ACCEPTED');

      const reciprocalEdge = await testPrisma.contact.findUnique({
        where: { userId_contactId: { userId: user1.id, contactId: user2.id } },
      });
      expect(reciprocalEdge?.status).toBe('ACCEPTED');
    });

    it('returns 404 if request does not exist', async () => {
      const res = await request(app)
        .post(`/api/contacts/${user1.id}/requests/${user2.id}/accept`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('POST /api/contacts/:userId/requests/:contactId/reject', () => {
    it('deletes pending request', async () => {
      await testPrisma.contact.create({
        data: { userId: user2.id, contactId: user1.id, status: 'PENDING' },
      });

      const res = await request(app)
        .post(`/api/contacts/${user1.id}/requests/${user2.id}/reject`);

      expect(res.status).toBe(204);

      // Verify request is deleted
      const contact = await testPrisma.contact.findUnique({
        where: { userId_contactId: { userId: user2.id, contactId: user1.id } },
      });
      expect(contact).toBeNull();
    });
  });

  describe('DELETE /api/contacts/:userId/:contactId', () => {
    it('deletes both directions of friendship', async () => {
      // Create symmetric accepted friendship
      await testPrisma.contact.create({
        data: { userId: user1.id, contactId: user2.id, status: 'ACCEPTED' },
      });
      await testPrisma.contact.create({
        data: { userId: user2.id, contactId: user1.id, status: 'ACCEPTED' },
      });

      const res = await request(app).delete(`/api/contacts/${user1.id}/${user2.id}`);

      expect(res.status).toBe(204);

      // Verify both edges deleted
      const edge1 = await testPrisma.contact.findUnique({
        where: { userId_contactId: { userId: user1.id, contactId: user2.id } },
      });
      const edge2 = await testPrisma.contact.findUnique({
        where: { userId_contactId: { userId: user2.id, contactId: user1.id } },
      });
      expect(edge1).toBeNull();
      expect(edge2).toBeNull();
    });
  });
});
