import { PrismaClient } from "@prisma/client";
import { prisma as appPrisma } from "../../src/db";

// Use the same Prisma instance as the app in tests
// This ensures tests operate on the same database connection
export const testPrisma = appPrisma;

/**
 * Clean all tables before each test
 * Maintains referential integrity by deleting in correct order
 */
export async function cleanDatabase() {
  await testPrisma.hangoutVisibility.deleteMany();
  await testPrisma.hangout.deleteMany();
  await testPrisma.userInterest.deleteMany();
  await testPrisma.interest.deleteMany();
  await testPrisma.contact.deleteMany();
  await testPrisma.contactCategory.deleteMany();
  await testPrisma.user.deleteMany();
}

/**
 * Disconnect Prisma after all tests complete
 */
export async function disconnectDatabase() {
  await testPrisma.$disconnect();
}

/**
 * Seed helper: create a test user
 */
export async function createTestUser(data: {
  firebaseUid: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
}) {
  return testPrisma.user.create({
    data: {
      firebaseUid: data.firebaseUid,
      email: data.email ?? `${data.firebaseUid}@test.com`,
      displayName: data.displayName ?? `User ${data.firebaseUid}`,
      photoUrl: data.photoUrl ?? null,
    },
  });
}

/**
 * Seed helper: create a test hangout
 */
export async function createTestHangout(data: {
  userId: string;
  title: string;
  startsAt: Date;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  isPublic?: boolean;
}) {
  return testPrisma.hangout.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      startsAt: data.startsAt,
      isPublic: data.isPublic ?? false,
    },
  });
}
