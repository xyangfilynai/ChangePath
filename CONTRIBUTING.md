# Contributing

## Local setup

1. Start infrastructure:

```bash
docker compose up -d
```

2. Copy the API env file and adjust if needed:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Generate Prisma client and apply migrations:

```bash
npm run db:migrate
```

4. Seed the demo org, users, product catalog, and sample case:

```bash
npm run db:seed
```

5. Start the apps:

```bash
npm run dev
```

## Services

- Web: `http://localhost:5173`
- API health: `http://localhost:3001/api/health`
- PostgreSQL 16: `localhost:5432`
- Redis 7: `localhost:6379`
- MinIO: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

## Local auth

The Phase 1 development flow now uses local email/password sign-in and bearer sessions.

Seeded demo accounts:

- `alice@acmemedtech.com`
- `bob@acmemedtech.com`

Shared development password:

- `changepath-demo`

Override the password or session secret through `apps/api/.env`.

## Quality checks

Run the full workspace validation before pushing:

```bash
npm run check-all
```

## Migrations

- Prisma migration history lives under [apps/api/prisma/migrations](/Users/kqli/Desktop/ChangePath/apps/api/prisma/migrations).
- Commit migration files with schema changes.
- Prefer additive migrations; destructive production changes should be planned explicitly.

## Contracts

Forward-looking API contracts live under [docs/openapi](/Users/kqli/Desktop/ChangePath/docs/openapi).
Each completed phase should define the next phase's contract before implementation begins.
