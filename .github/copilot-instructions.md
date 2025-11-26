# GoTogether Backend - AI Coding Instructions

## Project Overview
Express + TypeScript + PostgreSQL + Prisma API for social hangout management with Firebase Authentication integration.

## Architecture & Structure

**Stack**: Express 5.x, TypeScript (strict mode), Prisma ORM, PostgreSQL, Firebase Auth, deployed to Heroku
**Entry Point**: `src/index.ts` - app setup and route mounting
**Database**: `src/db.ts` - Prisma Client singleton
**Routes**: `src/routes/` - modular route handlers using Express Router

### Database & Prisma Setup
- Single `PrismaClient` instance exported from `src/db.ts`
- Schema defined in `prisma/schema.prisma` with 5 models: User, Contact, ContactCategory, Hangout, HangoutVisibility
- Migrations stored in `prisma/migrations/`
- Connection via `DATABASE_URL` environment variable

```typescript
import { prisma } from "../db";
const users = await prisma.user.findMany();
```

### Data Model Overview
- **User**: Stores Firebase UID (`firebaseUid`), email, display name - linked to Firebase Authentication
- **ContactCategory**: User-created categories for organizing contacts (e.g., "Friends", "Work")
- **Contact**: M2M relationship between users with optional category assignment and custom nicknames
- **Hangout**: Events with title, description, location (lat/lng), datetime, visibility settings
- **HangoutVisibility**: Controls private hangout access by category or individual user

### Firebase Authentication Flow
- Users authenticate via Firebase (supports Google, Facebook, Discord, phone, etc.)
- Backend receives Firebase UID and creates/retrieves User record
- All API requests should validate Firebase ID tokens (not yet implemented)

## Development Workflow

**Dev Mode**: `npm run dev` - runs `ts-node-dev` with auto-restart
**Build**: `npm run build` - compiles TypeScript to `dist/`
**Production**: `npm start` - runs compiled `dist/index.js`
**Prisma Commands**:
- `npm run prisma:generate` - generates Prisma Client after schema changes
- `npm run prisma:migrate` - creates and applies new migration
- `npm run prisma:studio` - opens Prisma Studio GUI for database browsing

**Node Version**: Requires Node.js >= 18.x

## Coding Conventions

### Route Handlers Pattern
- Each route file exports an Express `Router()` instance
- Import `prisma` from `../db.ts` for database access
- Use async/await with try/catch for error handling
- Return JSON with proper HTTP status codes

Example from `src/routes/hangouts.ts`:
```typescript
import { Router } from "express";
import { prisma } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const hangouts = await prisma.hangout.findMany({
      orderBy: { startsAt: "asc" },
    });
    res.json(hangouts);
  } catch (err) {
    console.error("Failed to fetch hangouts:", err);
    res.status(500).json({ error: "Failed to fetch hangouts" });
  }
});

export default router;
```

### Prisma Usage Patterns
- Use `findMany()`, `findUnique()`, `create()`, `update()`, `delete()` methods
- Use `select` to specify which fields to return
- Use `include` to fetch relations
- Leverage type safety - Prisma auto-generates TypeScript types

### TypeScript Configuration
- Strict mode enabled
- CommonJS module output (not ESM)
- Root: `src/`, output: `dist/`

## When Adding New Features

**New API Endpoint**: Create route file in `src/routes/`, import into `src/index.ts` and mount with `app.use()`
**Database Changes**: 
  1. Modify `prisma/schema.prisma`
  2. Run `npm run prisma:migrate` to create migration (dev environment)
  3. Migration files are generated in `prisma/migrations/` - commit these to Git
  4. Prisma Client auto-regenerates with new types
  5. On Heroku deployment, `prisma migrate deploy` runs automatically via Procfile
**Environment Variables**: Add to `.env` file (DATABASE_URL, PORT, NODE_ENV currently used)
**Error Handling**: Always wrap Prisma queries in try/catch, log errors, return appropriate HTTP status

## Location Features
For hangout locations, use `latitude`/`longitude` fields for precise geolocation. Store human-readable address in `location` string field. Consider integrating OpenStreetMap Nominatim API (free) or Google Maps API for geocoding.
