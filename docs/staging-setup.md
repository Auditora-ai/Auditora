# Staging Environment Setup (Vercel + Supabase)

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Vercel (staging)                               │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   SaaS   │  │Marketing │  │   Docs   │      │
│  │ staging  │  │ staging  │  │ staging  │      │
│  └────┬─────┘  └──────────┘  └──────────┘      │
│       │  SSL auto  CDN  DDoS protection         │
└───────┼─────────────────────────────────────────┘
        │
        │  DATABASE_URL
        ▼
┌──────────────────┐
│  Supabase        │
│  (Postgres 500MB)│
│  Free tier       │
└──────────────────┘
```

## Step-by-step Setup

### Step 1: Create Supabase project

1. Go to https://supabase.com and sign up / log in
2. Create a new project:
   - Name: `auditora-staging`
   - Database password: (save this!)
   - Region: closest to your users
3. Wait for provisioning (~2 min)
4. Go to **Settings > Database**
5. Copy the **Connection string** (URI format)
   - It looks like: `postgresql://postgres.XXXX:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres`
6. Also copy the **Direct connection** string (for migrations)

### Step 2: Login to Vercel

```bash
# Install CLI if not installed
npm i -g vercel

# Login
vercel login
```

### Step 3: Run the setup script

```bash
# From the repo root (on the staging branch)
git checkout staging
./scripts/setup-vercel.sh
```

This script will:
- Create 3 Vercel projects: `auditora-staging`, `auditora-marketing-staging`, `auditora-docs-staging`
- Link each app directory to its project
- Optionally deploy the first time

### Step 4: Configure environment variables

Go to each Vercel project dashboard and set these **Preview** environment variables:

#### SaaS app (auditora-staging) - CRITICAL

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase pooler connection string |
| `DIRECT_URL` | Supabase direct connection string |
| `BETTER_AUTH_SECRET` | Random 64-char string (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SAAS_URL` | Your Vercel SaaS preview URL |
| `NEXT_PUBLIC_MARKETING_URL` | Your Vercel Marketing preview URL |
| `NEXT_PUBLIC_DOCS_URL` | Your Vercel Docs preview URL |
| `ORG_KEY_ENCRYPTION_SECRET` | Random 32-char string |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

#### SaaS app - Optional but recommended

| Variable | Value |
|----------|-------|
| `S3_ENDPOINT` | Your S3/MinIO endpoint (or use Vercel Blob) |
| `S3_ACCESS_KEY_ID` | Access key |
| `S3_SECRET_ACCESS_KEY` | Secret key |
| `NEXT_PUBLIC_AVATARS_BUCKET_NAME` | avatars |
| `NEXT_PUBLIC_DOCUMENTS_BUCKET_NAME` | documents |
| `RESEND_API_KEY` | For sending emails |
| `MAIL_FROM` | Sender email |
| `STRIPE_SECRET_KEY` | Stripe test key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `CRON_SECRET` | Random string |

#### Marketing app (auditora-marketing-staging)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SAAS_URL` | SaaS staging URL |
| `NEXT_PUBLIC_MARKETING_URL` | Marketing staging URL |

#### Docs app (auditora-docs-staging)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SAAS_URL` | SaaS staging URL |
| `NEXT_PUBLIC_DOCS_URL` | Docs staging URL |

### Step 5: Push Prisma schema to Supabase

```bash
# Set the Supabase connection string
export DATABASE_URL="postgresql://postgres.XXXX:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres"
export DIRECT_URL="postgresql://postgres.XXXX:PASSWORD@db.XXXX.supabase.co:5432/postgres"

# Push schema
cd packages/database
pnpm push

# Optional: seed
pnpm migrate
```

### Step 6: Push to staging branch

```bash
git push origin staging
```

GitHub Actions will automatically:
1. Run linting and type checks
2. Deploy all 3 apps to Vercel preview
3. Output the preview URLs

### Step 7: Configure custom domain (optional)

In each Vercel project dashboard:
1. Go to **Settings > Domains**
2. Add your staging domain (e.g. `staging.auditora.ai`, `app.staging.auditora.ai`)
3. Add the DNS records shown by Vercel to your domain provider

## GitHub Secrets Required

Set these in **GitHub > Repository > Settings > Secrets and variables > Actions**:

| Secret | Where to find it |
|--------|------------------|
| `VERCEL_TOKEN` | Vercel Dashboard > Settings > Tokens > Create Token |
| `VERCEL_ORG_ID` | `.vercel/project.json` in any linked app, or Vercel Dashboard > Settings > General |
| `VERCEL_PROJECT_ID_SAAS` | `.vercel/project.json` in apps/saas |
| `VERCEL_PROJECT_ID_MARKETING` | `.vercel/project.json` in apps/marketing |
| `VERCEL_PROJECT_ID_DOCS` | `.vercel/project.json` in apps/docs |

## Daily Workflow

```bash
# Work on a feature branch
git checkout -b feature/my-feature
# ... make changes ...

# Merge to staging for testing
git checkout staging
git merge feature/my-feature
git push origin staging
# → Auto-deploys to Vercel staging URLs

# When ready for production
git checkout main
git merge staging
git push origin main
# → Production deploy (separate pipeline)
```

## Local Development

The original `docker-compose.yml` still works for local dev:

```bash
# Start local Postgres + MinIO
docker compose up -d

# Start dev servers
pnpm dev
```

## Monitoring

- **Vercel Dashboard** > Project > Deployments - see every deploy, logs, analytics
- **Vercel Dashboard** > Project > Speed Insights - real performance data
- **Supabase Dashboard** - database metrics, logs, SQL editor
- **Health check**: `GET /api/health` on the SaaS URL

## Costs (Staging)

| Service | Cost |
|---------|------|
| Vercel (Hobby) | Free |
| Supabase (Free tier) | Free (500MB DB, 1GB storage) |
| **Total staging** | **$0/month** |

Vercel Pro ($20/mo per team member) adds: more bandwidth, longer functions, password protection on previews.
