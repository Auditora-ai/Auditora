# TODOS

## Deferred from Session Continuity PR (2026-03-29)

### Consolidate duplicate prev-session queries
- **What:** In `apps/saas/app/api/sessions/route.ts`, the auto-link block and `seedNodesFromPreviousSession` both query for the most recent ENDED session. Refactor to query once and pass the result.
- **Why:** DRY violation — same WHERE clause repeated 20 lines apart.
- **How:** Change `seedNodesFromPreviousSession(sessionId, processDefId)` signature to accept optional `sourceSessionId`. If provided, skip the internal `findFirst`.
- **Priority:** Low
- **Depends on:** Nothing

### Write TTL cache unit test for session-context.ts
- **What:** Add `packages/ai/src/context/__tests__/session-context.test.ts` testing cache TTL behavior.
- **Why:** The TTL cache is the only pure-module testable code in this PR. Establishes test pattern for the AI package.
- **How:** Mock `db`, call `buildSessionContext` twice within TTL (expect cached), then after TTL (expect refetch via mock).
- **Priority:** Medium
- **Depends on:** Nothing (can use vitest or bun:test)
