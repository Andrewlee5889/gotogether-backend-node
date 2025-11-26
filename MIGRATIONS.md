# Prisma Migrations Guide

## Overview

This project uses **Prisma Migrate** for database schema management. Migrations are versioned SQL files that track all changes to your database schema over time.

## Migration Workflow

### Local Development

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create and apply migration**:
   ```bash
   npm run prisma:migrate
   ```
   This will:
   - Prompt you for a migration name
   - Generate SQL migration files in `prisma/migrations/`
   - Apply the migration to your local database
   - Regenerate Prisma Client with updated types

3. **Check migration status**:
   ```bash
   npm run prisma:migrate:status
   ```

### Production Deployment (Heroku)

Your Heroku deployment is already configured! The `Procfile` includes:

```yaml
release: npx prisma migrate deploy
web: npm start
```

**What happens on deploy:**
1. Heroku runs the `release` phase before starting your app
2. `prisma migrate deploy` applies any pending migrations
3. Only runs migrations that haven't been applied yet (safe to run multiple times)
4. If migrations fail, the deployment is halted

**Build process:**
- `heroku-postbuild` script runs `npm run build`
- `build` script runs `prisma generate && tsc`
- Generates Prisma Client before compiling TypeScript

## Migration Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run prisma:migrate` | Create & apply migration (dev) | Local development when you change schema |
| `npm run prisma:migrate:deploy` | Apply pending migrations | Production deployments (automated in Procfile) |
| `npm run prisma:migrate:status` | Check applied migrations | Verify which migrations are pending |
| `npm run prisma:generate` | Regenerate Prisma Client | After pulling schema changes |
| `npm run prisma:studio` | Open database GUI | Browse/edit data visually |

## Migration Folder Structure

```
prisma/
├── schema.prisma          # Source of truth for your data model
└── migrations/
    ├── 20250126_init/     # Example migration folder (timestamp_name)
    │   └── migration.sql  # SQL commands to apply
    ├── 20250126_add_contacts_status/
    │   └── migration.sql
    └── migration_lock.toml # Ensures consistent migration execution
```

## Best Practices

### ✅ DO:
- **Commit migrations to Git** - They're part of your codebase
- **Run migrations before starting dev server** - Keeps DB in sync
- **Use descriptive migration names** - e.g., "add_user_avatar_field"
- **Review generated SQL** - Check migration files before committing
- **Test migrations on staging** - Before deploying to production

### ❌ DON'T:
- **Don't edit applied migrations** - Create new ones instead
- **Don't run `prisma migrate dev` in production** - Use `migrate deploy`
- **Don't modify `migration_lock.toml`** - Prisma manages this
- **Don't delete migrations folder** - You'll lose migration history

## Creating Your First Migration

Since you've been editing the schema directly, create an initial migration:

```bash
# 1. Ensure DATABASE_URL is set in .env
# 2. Create initial migration
npm run prisma:migrate
# When prompted, enter name: "init"

# 3. Verify migration was created
ls prisma/migrations

# 4. Check migration status
npm run prisma:migrate:status
```

## Handling Schema Changes

### Example: Adding a new field

1. Edit `prisma/schema.prisma`:
   ```prisma
   model User {
     id String @id @default(cuid())
     bio String? // ← New field
     // ... other fields
   }
   ```

2. Create migration:
   ```bash
   npm run prisma:migrate
   # Name it: "add_user_bio"
   ```

3. Prisma generates SQL like:
   ```sql
   ALTER TABLE "User" ADD COLUMN "bio" TEXT;
   ```

4. Commit both files:
   ```bash
   git add prisma/schema.prisma
   git add prisma/migrations/
   git commit -m "Add user bio field"
   ```

## Troubleshooting

### Migration fails on Heroku
- Check Heroku logs: `heroku logs --tail`
- Verify DATABASE_URL is set: `heroku config:get DATABASE_URL`
- Check migration status locally: `npm run prisma:migrate:status`

### "Database is out of sync" error
```bash
# Reset local database (DESTRUCTIVE - dev only!)
npx prisma migrate reset

# Or apply pending migrations
npm run prisma:migrate:deploy
```

### Need to revert a migration
```bash
# Rollback isn't built-in, you need to:
# 1. Create a new migration that reverses the changes
# 2. Or manually run SQL to undo changes
# 3. Consider using a backup/restore strategy
```

## Production Deployment Checklist

- [ ] All migrations committed to Git
- [ ] Migrations tested locally
- [ ] DATABASE_URL configured on Heroku
- [ ] `Procfile` includes `release: npx prisma migrate deploy`
- [ ] `package.json` build script includes `prisma generate`
- [ ] Backup production database before major schema changes

## Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Deploying to Heroku](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-heroku)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/troubleshooting-development)
