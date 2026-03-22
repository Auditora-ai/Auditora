# Prozea — Development Guide

## What is this?
Prozea is an AI-powered process elicitation platform. It joins video calls, provides consultants with a teleprompter of guided questions, and auto-diagrams business processes live during the meeting using BPMN notation.

## Tech Stack
- **Framework**: Next.js (via supastarter-nextjs template)
- **Database**: Supabase (Postgres + Realtime + Storage — NOT using Supabase Auth)
- **Auth**: better-auth (via supastarter — NOT Supabase Auth)
- **ORM**: Prisma (server-side), Supabase client (browser-side for Realtime/Storage only)
- **Deploy**: Railway (3 services: web, AI worker, Redis)
- **Call Bot**: Recall.ai
- **STT**: Deepgram (real-time + speaker diarization)
- **LLM**: Claude API (process extraction + teleprompter)
- **BPMN**: bpmn-js Modeler (restricted mode)
- **Real-time**: Supabase Realtime Broadcast
- **Queue**: BullMQ + Redis

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

Key design principle: **Dual-temperature UI** — dark chrome for consultant panels, light canvas for BPMN diagram.

## Development Methodology
- Specs via spec-kit (GitHub-based)
- Git-based workflow with Claude Code
- Tests: Golden transcript snapshots + LLM-as-judge eval suite for AI pipeline
