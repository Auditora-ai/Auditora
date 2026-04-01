#!/usr/bin/env bash
# =============================================================================
# Auditora.ai - Vercel Staging Setup
# =============================================================================
# This script links the 3 Next.js apps to Vercel projects for staging.
#
# Prerequisites:
#   1. vercel CLI installed: npm i -g vercel
#   2. Logged in: vercel login
#   3. Run from the repo root
#
# Usage:
#   ./scripts/setup-vercel.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------------------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------------------
check() {
    log_info "Checking prerequisites..."
    
    if ! command -v vercel &> /dev/null; then
        log_err "Vercel CLI not found. Run: npm i -g vercel"
        exit 1
    fi
    
    if [ ! -f "apps/saas/vercel.json" ]; then
        log_err "vercel.json not found in apps/saas. Run from repo root."
        exit 1
    fi
    
    # Check if logged in
    if ! vercel whoami &>/dev/null; then
        log_err "Not logged in to Vercel. Run: vercel login"
        exit 1
    fi
    
    local user
    user=$(vercel whoami 2>/dev/null)
    log_ok "Logged in as: $user"
}

# ---------------------------------------------------------------------------
# Link a single project
# ---------------------------------------------------------------------------
link_project() {
    local app_dir="$1"
    local project_name="$2"
    local app_name="$3"
    
    log_info "Setting up Vercel project: $project_name"
    
    cd "$app_dir"
    
    # Check if already linked
    if [ -d ".vercel" ] && [ -f ".vercel/project.json" ]; then
        log_warn "$app_name already linked. Skipping..."
        cd - > /dev/null
        return
    fi
    
    # Link to Vercel (creates new project or links existing)
    # --yes skips prompts, --scope uses your default team
    vercel link \
        --yes \
        --project "$project_name" \
        2>&1 || {
            log_warn "Project '$project_name' may not exist yet. Creating..."
            vercel link --yes 2>&1
        }
    
    log_ok "$app_name linked to Vercel project: $project_name"
    cd - > /dev/null
}

# ---------------------------------------------------------------------------
# Set environment variables
# ---------------------------------------------------------------------------
set_env_vars() {
    local app_dir="$1"
    local app_name="$2"
    
    log_info "Setting environment variables for $app_name..."
    
    local env_file=".env.staging"
    if [ ! -f "$env_file" ]; then
        log_warn ".env.staging not found. Skipping env var setup."
        log_warn "Set env vars manually in the Vercel dashboard or create .env.staging first."
        return
    fi
    
    # Read .env.staging and set each var in Vercel (staging = preview environment)
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        # Remove quotes from value
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        if [ -n "$value" ]; then
            cd "$app_dir"
            vercel env add "$key" preview <<< "$value" 2>/dev/null || true
            cd - > /dev/null
        fi
    done < "$env_file"
    
    log_ok "Environment variables set for $app_name"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "  Auditora.ai - Vercel Staging Setup"
echo "=========================================="
echo ""

check

TEAM_NAME=""
echo ""
log_info "Enter your Vercel team name (or press Enter for personal account):"
read -r TEAM_NAME

SCOPE_FLAG=""
if [ -n "$TEAM_NAME" ]; then
    SCOPE_FLAG="--scope $TEAM_NAME"
fi

# ---------------------------------------------------------------------------
# Project names
# ---------------------------------------------------------------------------
SAAS_PROJECT="auditora-staging"
MARKETING_PROJECT="auditora-marketing-staging"
DOCS_PROJECT="auditora-docs-staging"

echo ""
log_info "Projects to create/link:"
echo "  1. $SAAS_PROJECT (SaaS app)"
echo "  2. $MARKETING_PROJECT (Marketing site)"
echo "  3. $DOCS_PROJECT (Documentation)"
echo ""
log_info "Continue? [Y/n]"
read -r confirm
if [ "$confirm" = "n" ] || [ "$confirm" = "N" ]; then
    log_info "Cancelled"
    exit 0
fi

# ---------------------------------------------------------------------------
# Link projects
# ---------------------------------------------------------------------------
link_project "apps/saas" "$SAAS_PROJECT" "SaaS"
link_project "apps/marketing" "$MARKETING_PROJECT" "Marketing"
link_project "apps/docs" "$DOCS_PROJECT" "Docs"

# ---------------------------------------------------------------------------
# Set env vars
# ---------------------------------------------------------------------------
echo ""
log_info "Set environment variables from .env.staging? [Y/n]"
read -r env_confirm
if [ "$env_confirm" != "n" ] && [ "$env_confirm" != "N" ]; then
    set_env_vars "apps/saas" "SaaS"
    set_env_vars "apps/marketing" "Marketing"
    set_env_vars "apps/docs" "Docs"
fi

# ---------------------------------------------------------------------------
# First deploy
# ---------------------------------------------------------------------------
echo ""
log_info "Deploy to Vercel now? [Y/n]"
read -r deploy_confirm
if [ "$deploy_confirm" != "n" ] && [ "$deploy_confirm" != "N" ]; then
    log_info "Deploying SaaS..."
    cd apps/saas && vercel deploy --branch staging $SCOPE_FLAG && cd - > /dev/null
    
    log_info "Deploying Marketing..."
    cd apps/marketing && vercel deploy --branch staging $SCOPE_FLAG && cd - > /dev/null
    
    log_info "Deploying Docs..."
    cd apps/docs && vercel deploy --branch staging $SCOPE_FLAG && cd - > /dev/null
fi

echo ""
log_ok "Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Create Supabase project at https://supabase.com"
echo "  2. Set DATABASE_URL in Vercel dashboard for all projects"
echo "  3. Push to staging branch to auto-deploy:"
echo "     git push origin staging"
echo ""
