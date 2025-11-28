import request from 'supertest';
import app from '../src/app';
import { testPrisma, cleanDatabase, disconnectDatabase } from './helpers/db';

// Mock Firebase Auth middleware to inject test auth user
jest.mock('../src/middleware/firebaseAuth', () => ({
  firebaseAuth: (req: any, _res: any, next: any) => {
    req.authUser = { 
      uid: 'test-firebase-uid', 
      email: 'testuser@firebase.com', 
      name: 'Test User', 
      picture: 'https://example.com/photo.jpg' 
    };
    next();
  },
}));

describe('Users Auth API - Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /api/users/sync', () => {
    it('creates new user from Firebase token on first sync', async () => {
      const res = await request(app)
        .post('/api/users/sync')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        firebaseUid: 'test-firebase-uid',
        email: 'testuser@firebase.com',
        displayName: 'Test User',
        photoUrl: 'https://example.com/photo.jpg',
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();

      // Verify user exists in database
      const user = await testPrisma.user.findUnique({
        where: { firebaseUid: 'test-firebase-uid' },
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe('testuser@firebase.com');
      expect(user?.displayName).toBe('Test User');
    });

    it('updates existing user on subsequent syncs', async () => {
      // Create initial user
      const existingUser = await testPrisma.user.create({
        data: {
          firebaseUid: 'test-firebase-uid',
          email: 'old@email.com',
          displayName: 'Old Name',
          photoUrl: null,
        },
      });

      const res = await request(app)
        .post('/api/users/sync')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(existingUser.id); // Same ID
      expect(res.body).toMatchObject({
        firebaseUid: 'test-firebase-uid',
        email: 'testuser@firebase.com', // Updated
        displayName: 'Test User', // Updated
        photoUrl: 'https://example.com/photo.jpg', // Updated
      });

      // Verify database was updated
      const updatedUser = await testPrisma.user.findUnique({
        where: { firebaseUid: 'test-firebase-uid' },
      });
      expect(updatedUser?.email).toBe('testuser@firebase.com');
      expect(updatedUser?.displayName).toBe('Test User');
      
      // Verify only one user exists (upsert, not duplicate)
      const allUsers = await testPrisma.user.findMany({
        where: { firebaseUid: 'test-firebase-uid' },
      });
      expect(allUsers).toHaveLength(1);
    });
  });

  describe('GET /api/users/me', () => {
    it('returns current user from Firebase token', async () => {
      // Pre-create user
      const user = await testPrisma.user.create({
        data: {
          firebaseUid: 'test-firebase-uid',
          email: 'testuser@firebase.com',
          displayName: 'Test User',
          photoUrl: 'https://example.com/photo.jpg',
        },
      });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.id,
        firebaseUid: 'test-firebase-uid',
        email: 'testuser@firebase.com',
        displayName: 'Test User',
        photoUrl: 'https://example.com/photo.jpg',
      });
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it('returns 404 if user does not exist in database', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user by id with full details', async () => {
      const user = await testPrisma.user.create({
        data: {
          firebaseUid: 'another-user-uid',
          email: 'another@example.com',
          displayName: 'Another User',
          photoUrl: null,
        },
      });

      const res = await request(app).get(`/api/users/${user.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.id,
        firebaseUid: 'another-user-uid',
        email: 'another@example.com',
        displayName: 'Another User',
        photoUrl: null,
      });
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('GET /api/users', () => {
    it('lists all users', async () => {
      await testPrisma.user.create({
        data: { firebaseUid: 'user1', email: 'user1@example.com', displayName: 'User 1' },
      });
      await testPrisma.user.create({
        data: { firebaseUid: 'user2', email: 'user2@example.com', displayName: 'User 2' },
      });

      const res = await request(app).get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('email');
      expect(res.body[0]).toHaveProperty('displayName');
    });
  });
});
