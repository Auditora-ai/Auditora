# Auditora.ai — Architecture & Agent Operations

> **Fuente de verdad** para infraestructura, despliegues y agentes autónomos.
> Última actualización: 2026-04-02

---

## 1. Infrastructure

### Monorepo
- **Path:** `/home/clawuser/projects/Auditora`
- **Stack:** Next.js 16.2 + TypeScript + pnpm + Turborepo
- **Apps:** `marketing` (landing), `saas` (app principal), `docs`
- **Packages:** `database`, `process-engine`, `payments`, `i18n`, `mail`, etc.

### Production (Railway)
- **Platform:** Railway
- **Project:** `aiprocess.me`
- **Service:** `Prozea`
- **Environment:** `production`
- **URL:** https://app.auditora.ai (custom domain)
- **Build:** Nixpacks (Railpack) — **NO usar Dockerfile** (existe como `Dockerfile.manual` solo para referencia/local)
- **Port:** 8080
- **Database:** Supabase PostgreSQL (us-east-1, connection pooler pgbouncer en port 6543)
- **Redis:** Railway internal (`redis://...railway.internal:6379`)

### Staging (Vercel)
- **Platform:** Vercel
- **Team:** `auditora` (team_a3E0eOO1oxC7y3jmYXPUaeqU)
- **Project:** `marketing` (prj_HOqnmxh1t3RNyV1mJeofGf649LnS)
- **Deploy:** Git-connected, auto-deploy from repo

### Git
- **Repo:** `Auditora-ai/Auditora` on GitHub
- **SSH remote:** `git@github-auditora:Auditora-ai/Auditora.git`
- **Branches:**
  - `staging` — development branch (agents commit here)
  - `main` — production branch (only Agent #07 merges here)

---

## 2. Git Workflow & Rules

```
Agents #01-#06          Agent #07 (Prod Orchestrator)
    │                           │
    ▼                           ▼
  staging ──── review ────► main ──── auto-deploy ────► Railway (prod)
```

### Rules
1. **Agents #01-#06 ONLY commit to `staging`** — never to `main`
2. **Agent #07 is the ONLY agent that merges staging → main and deploys to production**
3. Never force push to `main`
4. Never rewrite git history on `main`
5. `.pm-config` is in `.gitignore` — never commit secrets

---

## 3. Autonomous Agents

| # | Name | ID | Model | Frequency | Delivers | Responsibility |
|---|------|----|-------|-----------|----------|---------------|
| 01 | Web Excellence | `eee1e0c9d3bd` | Sonnet 4.6 | 2h | origin | Landing page, tools, SEO, integrate animations |
| 02 | Animation Designer | `fe61ee2816f3` | Sonnet 4.6 | 2h | origin | Framer Motion animations in `modules/home/components/animations/` |
| 03 | PM Agent | `a6ce0ebbea90` | Opus 4.6 | 4h | origin | Product specs, RICE prioritization, PROGRESS.md |
| 04 | Developer Agent | `92874a4f0c8a` | Opus 4.6 | 4h | origin | SaaS core features, code, commits to staging |
| 05 | QA Agent | `6d25809c4cec` | Sonnet 4.6 | 4h | origin | Testing, bug reports, quality checks |
| 06 | AI Specialist | `c4ec2aa62c79` | Sonnet 4.6 | 6h | origin | AI/LLM features, prompts, evaluations |
| 07 | Prod Orchestrator | `1f2450b51271` | Opus 4.6 | 2h | **WhatsApp** | Health checks, staging→main merge, Railway deploy, DB migrations |

### Agent Coordination Flow
```
#03 PM ──specs──► #04 Developer ──code──► staging
#02 Animation ──components──► #01 Web Excellence ──integrate──► staging
#05 QA ──bug reports──► staging (docs/issues/qa/)
#06 AI Specialist ──AI features──► staging
                                        │
                            #07 Prod Orchestrator
                                        │
                                staging → main → Railway deploy
                                        │
                                  WhatsApp report → Oscar
```

### Agent #07 Responsibilities (Production)
1. **Health Check** — curl https://app.auditora.ai, check Railway logs
2. **Review Staging** — `git log origin/main..origin/staging`
3. **Deploy** — merge staging→main, `railway up --service Prozea`
4. **DB Migrations** — `railway run npx prisma migrate status/deploy`
5. **Report** — concise WhatsApp status to Oscar

---

## 4. Deploy Process

### Production Deploy (ONLY Agent #07 or Oscar)
```bash
cd /home/clawuser/projects/Auditora
git checkout main
git merge staging --no-edit
git push origin main
railway up --service Prozea
```

### Important Notes
- Railway uses **Nixpacks** (not Docker). `Dockerfile.manual` exists for local/reference only.
- Railway injects env vars at runtime. NEXT_PUBLIC_* are baked at build time by Nixpacks.
- The `BETTER_AUTH_SECRET` must be available at build time (Nixpacks handles this from Railway vars).
- DB schema is managed via Prisma. Current prod DB is NOT managed by `prisma migrate` — it was set up with `db push`. Use `railway run npx prisma migrate status` to check.

### Railway CLI
```bash
railway whoami          # Check auth
railway status          # Current project/env/service
railway logs -n 30      # Recent logs
railway deployment list # Deploy history
railway up              # Deploy current directory
railway variables       # View env vars
railway run <cmd>       # Run command with Railway env vars
```

---

## 5. Key File Locations

| What | Where |
|------|-------|
| Product Vision | `docs/PRODUCT_VISION.md` |
| Architecture (this) | `docs/ARCHITECTURE.md` |
| Progress Tracking | `docs/issues/PROGRESS.md` |
| Issue Specs | `docs/issues/F1-*.md` |
| QA Reports | `docs/issues/qa/` |
| Production Env | `~/.secrets/auditora-prod.env` (NEVER commit) |
| Prisma Schema | `packages/database/prisma/schema.prisma` |
| Animations | `apps/marketing/modules/home/components/animations/` |

---

## 6. For Agents: DO and DON'T

### DO
- Always work on `staging` branch (agents #01-#06)
- Update `docs/issues/PROGRESS.md` after completing tasks
- Write clear commit messages
- Test changes locally before committing if possible
- Check `docs/PRODUCT_VISION.md` for product direction

### DON'T
- ❌ Commit to `main` (only Agent #07)
- ❌ Deploy to Railway (only Agent #07)
- ❌ Force push any branch
- ❌ Commit secrets, tokens, or .env files
- ❌ Run destructive DB migrations without approval
- ❌ Create new cron jobs
- ❌ Modify `docs/ARCHITECTURE.md` without explicit instruction
