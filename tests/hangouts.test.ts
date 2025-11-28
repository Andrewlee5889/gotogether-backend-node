import request from 'supertest';
import app from '../src/app';
import { testPrisma, cleanDatabase, disconnectDatabase, createTestUser, createTestHangout } from './helpers/db';

describe('Hangouts API - Integration Tests', () => {
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    await cleanDatabase();
    
    user1 = await createTestUser({
      firebaseUid: 'hangout-user1',
      email: 'user1@hangouts.com',
      displayName: 'Hangout User 1',
    });
    
    user2 = await createTestUser({
      firebaseUid: 'hangout-user2',
      email: 'user2@hangouts.com',
      displayName: 'Hangout User 2',
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /api/hangouts', () => {
    it('returns all hangouts with full payload', async () => {
      const hangout1 = await createTestHangout({
        userId: user1.id,
        title: 'Coffee Meetup',
        description: 'Morning coffee',
        location: 'Cafe Downtown',
        latitude: 37.7749,
        longitude: -122.4194,
        startsAt: new Date('2025-12-01T10:00:00Z'),
        isPublic: true,
      });

      const hangout2 = await createTestHangout({
        userId: user2.id,
        title: 'Lunch Break',
        startsAt: new Date('2025-12-02T12:00:00Z'),
        isPublic: false,
      });

      const res = await request(app).get('/api/hangouts');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      
      const coffeeHangout = res.body.find((h: any) => h.id === hangout1.id);
      expect(coffeeHangout).toMatchObject({
        id: hangout1.id,
        userId: user1.id,
        title: 'Coffee Meetup',
        description: 'Morning coffee',
        location: 'Cafe Downtown',
        latitude: 37.7749,
        longitude: -122.4194,
        isPublic: true,
      });
      expect(new Date(coffeeHangout.startsAt).toISOString()).toBe('2025-12-01T10:00:00.000Z');
    });

    it('filters by title (case-insensitive)', async () => {
      await createTestHangout({
        userId: user1.id,
        title: 'Lunch at Cafe',
        startsAt: new Date('2025-12-01T12:00:00Z'),
      });
      
      await createTestHangout({
        userId: user1.id,
        title: 'Dinner Party',
        startsAt: new Date('2025-12-01T18:00:00Z'),
      });

      const res = await request(app).get('/api/hangouts?title=lunch');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Lunch at Cafe');
    });

    it('filters by userId', async () => {
      await createTestHangout({
        userId: user1.id,
        title: 'User 1 Event',
        startsAt: new Date('2025-12-01T10:00:00Z'),
      });
      
      await createTestHangout({
        userId: user2.id,
        title: 'User 2 Event',
        startsAt: new Date('2025-12-01T11:00:00Z'),
      });

      const res = await request(app).get(`/api/hangouts?userId=${user1.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('User 1 Event');
      expect(res.body[0].userId).toBe(user1.id);
    });

    it('filters by isPublic', async () => {
      await createTestHangout({
        userId: user1.id,
        title: 'Public Event',
        startsAt: new Date('2025-12-01T10:00:00Z'),
        isPublic: true,
      });
      
      await createTestHangout({
        userId: user1.id,
        title: 'Private Event',
        startsAt: new Date('2025-12-01T11:00:00Z'),
        isPublic: false,
      });

      const res = await request(app).get('/api/hangouts?isPublic=true');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Public Event');
      expect(res.body[0].isPublic).toBe(true);
    });

    it('filters by date range', async () => {
      await createTestHangout({
        userId: user1.id,
        title: 'Early Event',
        startsAt: new Date('2025-11-01T10:00:00Z'),
      });
      
      await createTestHangout({
        userId: user1.id,
        title: 'Mid Event',
        startsAt: new Date('2025-12-15T10:00:00Z'),
      });
      
      await createTestHangout({
        userId: user1.id,
        title: 'Late Event',
        startsAt: new Date('2026-01-15T10:00:00Z'),
      });

      const res = await request(app).get(
        '/api/hangouts?startsAtFrom=2025-12-01T00:00:00Z&startsAtTo=2025-12-31T23:59:59Z'
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Mid Event');
    });

    it('orders by startsAt ascending by default', async () => {
      await createTestHangout({
        userId: user1.id,
        title: 'Later',
        startsAt: new Date('2025-12-02T10:00:00Z'),
      });
      
      await createTestHangout({
        userId: user1.id,
        title: 'Earlier',
        startsAt: new Date('2025-12-01T10:00:00Z'),
      });

      const res = await request(app).get('/api/hangouts');

      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe('Earlier');
      expect(res.body[1].title).toBe('Later');
    });

    it('supports pagination', async () => {
      // Create 5 hangouts
      for (let i = 0; i < 5; i++) {
        await createTestHangout({
          userId: user1.id,
          title: `Event ${i}`,
          startsAt: new Date(`2025-12-0${i + 1}T10:00:00Z`),
        });
      }

      const page1 = await request(app).get('/api/hangouts?page=1&limit=2');
      expect(page1.status).toBe(200);
      expect(page1.body).toHaveLength(2);

      const page2 = await request(app).get('/api/hangouts?page=2&limit=2');
      expect(page2.status).toBe(200);
      expect(page2.body).toHaveLength(2);
      
      // Verify different results
      expect(page1.body[0].id).not.toBe(page2.body[0].id);
    });
  });

  describe('POST /api/hangouts', () => {
    it('creates hangout with full details', async () => {
      const res = await request(app)
        .post('/api/hangouts')
        .send({
          userId: user1.id,
          title: 'New Hangout',
          description: 'Test description',
          location: 'Test Location',
          latitude: 40.7128,
          longitude: -74.0060,
          startsAt: '2025-12-25T15:00:00Z',
          endsAt: '2025-12-25T17:00:00Z',
          isPublic: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: 'New Hangout',
        description: 'Test description',
        location: 'Test Location',
        latitude: 40.7128,
        longitude: -74.0060,
        isPublic: true,
      });
      expect(res.body.id).toBeDefined();

      // Verify in database
      const hangout = await testPrisma.hangout.findUnique({
        where: { id: res.body.id },
      });
      expect(hangout).toBeTruthy();
      expect(hangout?.title).toBe('New Hangout');
    });

    it('requires userId, title, and startsAt', async () => {
      const res = await request(app)
        .post('/api/hangouts')
        .send({ title: 'Missing fields' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });
  });

  describe('GET /api/hangouts/:id', () => {
    it('returns hangout by id', async () => {
      const hangout = await createTestHangout({
        userId: user1.id,
        title: 'Specific Hangout',
        startsAt: new Date('2025-12-01T10:00:00Z'),
      });

      const res = await request(app).get(`/api/hangouts/${hangout.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: hangout.id,
        title: 'Specific Hangout',
        userId: user1.id,
      });
    });

    it('returns 404 for non-existent hangout', async () => {
      const res = await request(app).get('/api/hangouts/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/hangouts/:id', () => {
    it('deletes hangout', async () => {
      const hangout = await createTestHangout({
        userId: user1.id,
        title: 'To Delete',
        startsAt: new Date('2025-12-01T10:00:00Z'),
      });

      const res = await request(app).delete(`/api/hangouts/${hangout.id}`);

      expect(res.status).toBe(204);

      // Verify deletion
      const deleted = await testPrisma.hangout.findUnique({
        where: { id: hangout.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
