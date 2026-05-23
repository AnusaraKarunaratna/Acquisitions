# Acquisitions Docker Setup (Neon Local + Neon Cloud)

This project supports two Docker workflows:

- **Development**: app + **Neon Local** proxy (ephemeral branches)
- **Production**: app + **Neon Cloud** database URL (no Neon Local container)

## Files

- `Dockerfile` - Multi-stage build with `development` and `production` targets
- `docker-compose.dev.yml` - Runs app + `neondatabase/neon_local`
- `docker-compose.prod.yml` - Runs app only (connects to Neon Cloud via `DATABASE_URL`)
- `.env.development` - Local dev values (Neon Local)
- `.env.production` - Production values (Neon Cloud)

## 1) Development (Neon Local)

Neon Local runs as `neon-local` and your app connects through:

- `postgres://neon:npg@neon-local:5432/neondb`

Neon Local creates ephemeral branches by default. If you set `PARENT_BRANCH_ID`, the ephemeral branch is created from that parent branch.

### Configure environment

Edit `.env.development` and provide:

- `NEON_API_KEY`
- `NEON_PROJECT_ID`
- Optional: `PARENT_BRANCH_ID` (if you want a specific parent branch)

### Start development stack

```bash
docker compose -f docker-compose.dev.yml --env-file .env.development up --build
```

### Stop development stack

```bash
docker compose -f docker-compose.dev.yml --env-file .env.development down
```

## 2) Production (Neon Cloud)

Production does **not** run Neon Local. The app reads `DATABASE_URL` from `.env.production` and connects directly to Neon Cloud.

### Configure environment

Edit `.env.production` and provide:

- `DATABASE_URL` (your Neon Cloud URL, e.g. `...neon.tech...`)
- `JWT_SECRET`
- `ARCJET_KEY`

### Start production stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

### Stop production stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

## How DATABASE_URL switches by environment

- In **development**, `docker-compose.dev.yml` sets:
  - `USE_NEON_LOCAL=true`
  - `DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb`
  - `NEON_LOCAL_HOST=neon-local`
- In **production**, `docker-compose.prod.yml` sets:
  - `USE_NEON_LOCAL=false`
  - `DATABASE_URL=${DATABASE_URL}` from `.env.production`

The application DB client in `src/config/database.js` checks `USE_NEON_LOCAL`/`NODE_ENV` and, for dev, routes Neon serverless HTTP traffic to:

- `http://neon-local:5432/sql`
