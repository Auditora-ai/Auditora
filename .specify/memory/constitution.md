# aiprocess.me Constitution

## Core Principles

### I. Real-Time First
Every feature must work in the context of a live meeting. Latency budget: 8 seconds for diagram updates. If a feature can't operate within this constraint, it belongs in post-meeting processing, not the live experience. The meeting IS the deliverable.

### II. Dual-Temperature Architecture
The consultant's private view (teleprompter, transcript, controls) uses dark chrome for a premium tool feel. The shared BPMN diagram canvas uses light background for professional client-facing screenshots. These are two distinct design contexts within the same screen.

### III. Graceful Degradation (NON-NEGOTIABLE)
Every external dependency (Recall.ai, Deepgram, Claude API, Supabase) WILL fail during a live meeting. Every failure must show a visible status indicator to the consultant. Audio recording always continues as fallback. No silent failures — ever.

### IV. Test the AI Pipeline
The process extraction AI is the product's core value. Golden transcript snapshots (structural assertions) + LLM-as-judge eval suite are mandatory for every change to prompts, extraction logic, or BPMN generation. No prompt change ships without eval results.

### V. Provider Abstraction
All external services (call bot, STT, LLM) are abstracted behind interfaces. Switching from Recall.ai to Meeting BaaS, or from Deepgram to AssemblyAI, or from Claude to GPT-4 must be a configuration change, not a rewrite.

### VI. Acquisition-Ready Code
Clean architecture, comprehensive tests, structured logging, usage metrics. Every feature should be built as if an acquirer's engineering team will audit the codebase next month.

## Technology Stack

- **Framework**: Next.js (supastarter-nextjs monorepo)
- **Database**: Supabase Postgres via Prisma (server-side)
- **Auth**: better-auth (via supastarter)
- **Real-time**: Supabase Realtime Broadcast (AI Worker → Browser)
- **Call Bot**: Recall.ai (CallBotProvider interface)
- **STT**: Deepgram (STTProvider interface)
- **LLM**: Claude API (parallel pipelines: process extraction + teleprompter)
- **BPMN**: bpmn-js Modeler (restricted mode)
- **Queue**: BullMQ + Redis (priority: extraction > teleprompter)
- **Deploy**: Railway (3 services: web, AI worker, Redis)

## Development Workflow

1. Specs written via spec-kit before implementation
2. Tests written before code (TDD for core pipeline, test-after for UI)
3. Golden transcript fixtures maintained in `tests/fixtures/transcripts/`
4. Every PR includes: code, tests, and updated ASCII diagrams if architecture changed
5. DESIGN.md is the source of truth for all visual decisions

## Quality Gates

- All tests pass (unit + integration + AI eval suite)
- No TypeScript errors (`tsc --noEmit`)
- Lint clean (`eslint`)
- AI eval score >= 7/10 for any prompt/extraction change
- DESIGN.md compliance for any UI change

## Governance

This constitution supersedes all other development practices. Amendments require documentation in the Decisions Log (DESIGN.md) with rationale.

**Version**: 1.0.0 | **Ratified**: 2026-03-22 | **Last Amended**: 2026-03-22
