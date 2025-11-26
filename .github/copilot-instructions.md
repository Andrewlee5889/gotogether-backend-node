# GoTogether Backend - AI Coding Instructions

## Project Overview
Simple Express + TypeScript + PostgreSQL API for managing hangouts. Single-file architecture with direct database queries using `pg` connection pool.

## Architecture & Structure

**Stack**: Express 5.x, TypeScript (strict mode), PostgreSQL via `pg`, deployed to Heroku
**Entry Point**: `src/index.ts` - all routes, middleware, and DB setup in one file

### Database Connection Pattern
- Single global `Pool` instance initialized at startup (`src/index.ts:14`)
- Uses `DATABASE_URL` environment variable for connection string
- Production SSL config: `{ rejectUnauthorized: false }` for Heroku Postgres compatibility
- Direct `pool.query()` calls in route handlers - no ORM, no query builders

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
```

### Database Schema
Discovered tables: `hangouts` (columns: `id`, `title`, `starts_at`)

## Development Workflow

**Dev Mode**: `npm run dev` - runs `ts-node-dev` with auto-restart on file changes
**Build**: `npm run build` - compiles TypeScript to `dist/` directory
**Production**: `npm start` - runs compiled `dist/index.js`

**Node Version**: Requires Node.js >= 18.x (see `package.json:engines`)

## Coding Conventions

### Route Handlers
- Async/await for all database operations
- Direct PostgreSQL query strings (no query builders)
- Return JSON responses with `res.json()`
- Basic error handling with try/catch, log to console, return 500 status

Example pattern from `/health`:
```typescript
app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    console.error("DB health check failed:", err);
    res.status(500).json({ status: "error" });
  }
});
```

### TypeScript Configuration
- Strict mode enabled (`tsconfig.json:strict: true`)
- CommonJS module output (not ESM)
- Root directory: `src/`, output: `dist/`

### Middleware Stack
Applied globally in order: `cors()` → `express.json()`

## When Adding New Features

**New API Endpoint**: Add route handler directly to `src/index.ts` after existing routes
**Database Queries**: Use `pool.query()` with raw SQL, access results via `result.rows`
**Environment Variables**: Add to `.env` file (DATABASE_URL, PORT, NODE_ENV are already used)
**Error Handling**: Follow try/catch pattern from `/health` endpoint - log errors and return 500 with JSON error object
