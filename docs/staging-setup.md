# Staging Environment Setup

This guide explains how to set up and manage the Auditora staging environment.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Staging Server (Docker Compose)                │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   SaaS   │  │Marketing │  │   Docs   │      │
│  │ :3000    │  │ :3001    │  │ :3002    │      │
│  └────┬─────┘  └──────────┘  └──────────┘      │
│       │                                         │
│  ┌────┴─────┐  ┌──────────┐  ┌──────────┐      │
│  │PostgreSQL│  │  MinIO   │  │  Redis   │      │
│  │ :5433    │  │ :9002/03 │  │ :6380    │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

## Quick Start

### 1. Create the staging environment file

```bash
cp .env.example .env.staging
```

Edit `.env.staging` and set at minimum:
- `BETTER_AUTH_SECRET` - random 64-char string
- `ORG_KEY_ENCRYPTION_SECRET` - random 32-char string
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` - for AI features
- `NEXT_PUBLIC_SAAS_URL` - your staging URL (e.g. `https://staging.auditora.ai`)
- `NEXT_PUBLIC_MARKETING_URL` - marketing staging URL

### 2. Deploy

```bash
# Full deploy (build + start)
./scripts/deploy-staging.sh

# Push database schema
./scripts/deploy-staging.sh --db-push

# Seed database (optional)
./scripts/deploy-staging.sh --seed
```

### 3. Verify

```bash
# Check status
./scripts/deploy-staging.sh --status

# Health check
curl http://localhost:3000/api/health
```

## Available Commands

| Command | Description |
|---------|-------------|
| `./scripts/deploy-staging.sh` | Build and start all services |
| `./scripts/deploy-staging.sh --build` | Rebuild images (no cache) |
| `./scripts/deploy-staging.sh --db-push` | Push Prisma schema to DB |
| `./scripts/deploy-staging.sh --seed` | Seed the database |
| `./scripts/deploy-staging.sh --logs` | Follow all logs |
| `./scripts/deploy-staging.sh --status` | Show running containers |
| `./scripts/deploy-staging.sh --restart` | Restart all services |
| `./scripts/deploy-staging.sh --down` | Stop all services |
| `./scripts/deploy-staging.sh --clean` | Delete all data and stop |

## GitHub Actions Auto-Deploy

When you push to the `staging` branch, GitHub Actions will:

1. Run linting and type checks
2. Build all 3 Next.js apps
3. Build and push Docker images to GHCR
4. SSH into the staging server and deploy

### Required GitHub Secrets

Set these in GitHub > Repository > Settings > Secrets:

| Secret | Description |
|--------|-------------|
| `STAGING_SERVER_HOST` | IP or hostname of staging server |
| `STAGING_SERVER_USER` | SSH username |
| `STAGING_SSH_KEY` | Private SSH key for deployment |
| `STAGING_PROJECT_PATH` | Path to project on server (default: `/opt/auditora-staging`) |
| `STAGING_SAAS_URL` | Full URL of staging SaaS app |

### First-time server setup

```bash
# On the staging server:
git clone git@github-auditora:Auditora-ai/Auditora.git /opt/auditora-staging
cd /opt/auditora-staging
git checkout staging
cp .env.example .env.staging
# Edit .env.staging with production-like values
```

## Ports (default, configurable via .env.staging)

| Service | Port | Env Variable |
|---------|------|--------------|
| SaaS App | 3000 | `STAGING_SAAS_PORT` |
| Marketing | 3001 | `STAGING_MARKETING_PORT` |
| Docs | 3002 | `STAGING_DOCS_PORT` |
| PostgreSQL | 5433 | `STAGING_DB_PORT` |
| MinIO API | 9002 | `STAGING_MINIO_API_PORT` |
| MinIO Console | 9003 | `STAGING_MINIO_CONSOLE_PORT` |
| Redis | 6380 | `STAGING_REDIS_PORT` |

## Database Management

```bash
# Connect to staging database
docker compose -f docker-compose.staging.yml exec postgres psql -U auditora auditora_staging

# Reset database (WARNING: deletes all data)
docker compose -f docker-compose.staging.yml exec saas npx prisma migrate reset

# Open Prisma Studio (database GUI)
docker compose -f docker-compose.staging.yml exec saas npx prisma studio
```

## Troubleshooting

### Build fails
```bash
# Clean everything and rebuild
./scripts/deploy-staging.sh --clean
./scripts/deploy-staging.sh --build
./scripts/deploy-staging.sh
```

### Database connection issues
```bash
# Check if postgres is healthy
docker compose -f docker-compose.staging.yml exec postgres pg_isready

# Check connection string
docker compose -f docker-compose.staging.yml exec saas env | grep DATABASE_URL
```

### View app logs
```bash
# All services
./scripts/deploy-staging.sh --logs

# Specific service
docker compose -f docker-compose.staging.yml logs -f saas
```
