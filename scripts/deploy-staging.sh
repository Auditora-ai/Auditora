#!/usr/bin/env bash
# =============================================================================
# Auditora.ai - Staging Deployment Script
# =============================================================================
# Usage:
#   ./scripts/deploy-staging.sh            # Full deploy (build + start)
#   ./scripts/deploy-staging.sh --build    # Rebuild images
#   ./scripts/deploy-staging.sh --db-push  # Push schema to staging DB
#   ./scripts/deploy-staging.sh --seed     # Seed staging DB
#   ./scripts/deploy-staging.sh --logs     # Follow staging logs
#   ./scripts/deploy-staging.sh --down     # Stop staging
#   ./scripts/deploy-staging.sh --status   # Check status
# =============================================================================

set -euo pipefail

COMPOSE_FILE="docker-compose.staging.yml"
COMPOSE_CMD="docker compose -f $COMPOSE_FILE"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
check_prereqs() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_err "Docker is not installed. Install it first."
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_err "Docker Compose v2 is not available."
        exit 1
    fi
    
    if [ ! -f ".env.staging" ]; then
        log_warn ".env.staging not found."
        if [ -f ".env.example" ]; then
            log_info "Creating .env.staging from .env.example..."
            cp .env.example .env.staging
            log_warn "EDIT .env.staging with your real staging values before deploying!"
        else
            log_err "No .env.example found either. Create .env.staging manually."
            exit 1
        fi
    fi
    
    log_ok "Prerequisites OK"
}

# ---------------------------------------------------------------------------
# Deploy
# ---------------------------------------------------------------------------
deploy() {
    log_info "Building and starting Auditora staging environment..."
    
    check_prereqs
    
    # Build images
    log_info "Building Docker images (this may take a few minutes on first run)..."
    $COMPOSE_CMD build --parallel
    
    # Start services
    log_info "Starting services..."
    $COMPOSE_CMD up -d
    
    # Wait for postgres to be ready
    log_info "Waiting for PostgreSQL..."
    sleep 5
    for i in $(seq 1 30); do
        if $COMPOSE_CMD exec -T postgres pg_isready -U auditora &>/dev/null; then
            log_ok "PostgreSQL is ready"
            break
        fi
        if [ "$i" -eq 30 ]; then
            log_err "PostgreSQL did not become ready in time"
            exit 1
        fi
        sleep 2
    done
    
    # Show status
    log_info "Staging environment status:"
    $COMPOSE_CMD ps
    
    echo ""
    log_ok "Staging deployment complete!"
    echo ""
    echo "  SaaS App:     http://localhost:${STAGING_SAAS_PORT:-3000}"
    echo "  Marketing:    http://localhost:${STAGING_MARKETING_PORT:-3001}"
    echo "  Docs:         http://localhost:${STAGING_DOCS_PORT:-3002}"
    echo "  MinIO Console: http://localhost:${STAGING_MINIO_CONSOLE_PORT:-9003}"
    echo "  PostgreSQL:   localhost:${STAGING_DB_PORT:-5433}"
    echo ""
    echo "  First time? Run: $0 --db-push"
}

# ---------------------------------------------------------------------------
# Push DB schema
# ---------------------------------------------------------------------------
db_push() {
    log_info "Pushing Prisma schema to staging database..."
    $COMPOSE_CMD exec -T saas npx prisma db push --schema=/app/packages/database/prisma/schema.prisma
    log_ok "Schema pushed"
}

# ---------------------------------------------------------------------------
# Seed DB
# ---------------------------------------------------------------------------
db_seed() {
    log_info "Seeding staging database..."
    $COMPOSE_CMD exec -T saas npx prisma db seed --schema=/app/packages/database/prisma/schema.prisma
    log_ok "Database seeded"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
case "${1:-}" in
    --build)
        check_prereqs
        log_info "Rebuilding images..."
        $COMPOSE_CMD build --parallel --no-cache
        log_ok "Build complete. Run '$0' to start."
        ;;
    --db-push)
        db_push
        ;;
    --seed)
        db_seed
        ;;
    --logs)
        $COMPOSE_CMD logs -f --tail=100
        ;;
    --down)
        log_info "Stopping staging environment..."
        $COMPOSE_CMD down
        log_ok "Stopped"
        ;;
    --restart)
        log_info "Restarting staging environment..."
        $COMPOSE_CMD restart
        log_ok "Restarted"
        ;;
    --status)
        $COMPOSE_CMD ps
        echo ""
        $COMPOSE_CMD logs --tail=5
        ;;
    --clean)
        log_warn "This will delete all staging data (DB, files, cache). Continue? [y/N]"
        read -r confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            $COMPOSE_CMD down -v
            log_ok "All staging data removed"
        else
            log_info "Cancelled"
        fi
        ;;
    *)
        deploy
        ;;
esac
