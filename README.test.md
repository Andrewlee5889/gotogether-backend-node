# Integration Testing Guide

## Overview

Your tests now use **real database integration testing** (RSpec/Rails style) instead of heavy mocking. This catches real bugs and verifies actual behavior.

## Test Philosophy

### ✅ What We Test Now (Detroit/Classical School)
- **Real database operations** with actual Prisma queries
- **Full HTTP response payloads** (not just status codes)
- **Database state verification** after operations
- **Complete request/response cycle** through routes → controllers → DB
- **Edge cases**: duplicates, 404s, validation errors

### ❌ What We Don't Mock
- Prisma Client (uses real test DB)
- Express routing
- Controllers
- Database queries

### ✅ What We DO Mock
- **Firebase Authentication** (external service)
- Future external APIs (Stripe, SendGrid, etc.)

## Setup

### 1. Create Test Database

```sql
-- In PostgreSQL
CREATE DATABASE gotogether_test;
```

### 2. Configure Environment

Create `.env.test`:
```bash
cp .env.test.example .env.test
```

Edit `.env.test` with your test database URL:
```env
DATABASE_URL_TEST="postgresql://user:password@localhost:5432/gotogether_test"
NODE_ENV=test
```

### 3. Run Migrations on Test DB

```powershell
# Apply all migrations to test database
$env:DATABASE_URL=$env:DATABASE_URL_TEST
npx prisma migrate deploy
```

Or use the npm script (PowerShell syntax varies):
```powershell
npm run test:setup
```

## Running Tests

```powershell
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run specific file
npx jest tests/contacts.test.ts

# Run with coverage
npx jest --coverage
```

## Test Structure

### Contacts Tests (`tests/contacts.test.ts`)
- ✅ Creates pending contact requests and verifies DB state
- ✅ Tests approval flow (accept/reject)
- ✅ Verifies symmetric friendship deletion
- ✅ Tests category assignment
- ✅ Validates error cases (duplicates, self-contact)

### Hangouts Tests (`tests/hangouts.test.ts`)
- ✅ Tests filtering (title, userId, isPublic, date ranges)
- ✅ Validates pagination
- ✅ Verifies full response payloads
- ✅ Tests creation with geolocation
- ✅ Validates ordering (by startsAt)

### Users Auth Tests (`tests/users.auth.test.ts`)
- ✅ Tests Firebase auth integration (mocked middleware)
- ✅ Verifies user sync (upsert) behavior
- ✅ Tests /me endpoint with real DB lookup
- ✅ Validates error cases (user not found)

## Test Helpers

Located in `tests/helpers/db.ts`:

```typescript
// Clean all tables before each test
await cleanDatabase();

// Disconnect after all tests
await disconnectDatabase();

// Create test user
const user = await createTestUser({
  firebaseUid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
});

// Create test hangout
const hangout = await createTestHangout({
  userId: user.id,
  title: 'Test Event',
  startsAt: new Date('2025-12-01T10:00:00Z'),
});
```

## Example Test Pattern

```typescript
describe('Feature', () => {
  let testUser: any;

  beforeEach(async () => {
    await cleanDatabase(); // Clear DB
    testUser = await createTestUser({ /* ... */ }); // Seed data
  });

  afterAll(async () => {
    await disconnectDatabase(); // Cleanup
  });

  it('tests behavior with full verification', async () => {
    // Act
    const res = await request(app)
      .post('/api/endpoint')
      .send({ data: 'value' });

    // Assert HTTP response
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ expected: 'shape' });

    // Assert database state
    const record = await testPrisma.model.findUnique({ where: { id: res.body.id } });
    expect(record?.field).toBe('expected-value');
  });
});
```

## Benefits vs. Mocking

| Aspect | Mock-Heavy (Old) | Integration (New) |
|--------|-----------------|-------------------|
| **Catches bugs** | ❌ Misses DTO errors, SQL issues | ✅ Real database errors |
| **Refactor safety** | ❌ Breaks when internals change | ✅ Tests behavior, not implementation |
| **Confidence** | ⚠️ "Tests pass but app breaks" | ✅ High confidence in deployments |
| **Speed** | ✅ Very fast | ⚠️ Slightly slower (still <5s total) |
| **Maintenance** | ❌ Brittle mocks | ✅ Easy to update |

## Troubleshooting

### Tests fail with "relation does not exist"
Run migrations on test DB:
```powershell
npm run test:setup
```

### "Cannot connect to database"
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL_TEST` in `.env.test`
3. Verify test database exists

### Tests pass but still slow
- Add indexes to frequently queried fields
- Use `beforeAll` for expensive setup when safe
- Consider parallel test execution (`jest --maxWorkers=4`)

### Prisma Client not found
```powershell
npm run prisma:generate
```

## Future Improvements

- [ ] Add factory functions for complex test data (FactoryBot equivalent)
- [ ] Parallel test execution with isolated DB schemas
- [ ] Snapshot testing for complex API responses
- [ ] Performance benchmarks for slow queries
- [ ] CI/CD integration with ephemeral test databases

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing/integration-testing)
- [Supertest GitHub](https://github.com/ladjs/supertest)
