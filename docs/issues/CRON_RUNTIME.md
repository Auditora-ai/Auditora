# Auditora Autonomous PM — Cron Job Runtime

This file documents how the autonomous PM cron job works.

## What it does
Runs continuously, working through GitHub issues one by one:
1. Read PROGRESS.md to find next issue
2. Read the issue from GitHub
3. Read PRODUCT_VISION.md for context
4. Delegate to Dev Agent with full context
5. QA the output (verify build, no orphan imports, tests pass)
6. Commit, push, close issue with summary
7. Update PROGRESS.md
8. Move to next issue

## Setup required each run
- SSH agent: `eval "$(ssh-agent -s)" && ssh-add ~/.ssh/auditora_key`
- GitHub auth: use GH_TOKEN from .pm-config
- Read .pm-config for credentials
- Read docs/issues/PROGRESS.md for current state

## Issue execution order
See docs/issues/PROGRESS.md for the wave plan.
Wave 1 (no deps): #2, #4, #7
Wave 2 (after wave 1): #6, #8, #10, #12
Wave 3 (after wave 2): #9, #11
Wave 4 (last): #13

## Rules
- TDD: tests before code on every issue
- One issue at a time
- Quality > speed
- If an issue fails QA, iterate on it (don't skip)
- Always push to staging branch
- Always close issue with summary comment
- Always update PROGRESS.md after each issue
