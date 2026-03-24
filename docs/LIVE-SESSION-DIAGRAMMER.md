# Live Session BPMN Diagrammer — Technical Reference

## Overview

The live session diagrammer allows BPM consultants to build BPMN diagrams in real-time during elicitation sessions. It combines AI extraction from conversation with manual input, producing professional BPMN 2.0 diagrams.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ MeetingView (CSS Grid: top/left/canvas/right/bottom)    │
│                                                         │
│  TopBar ─── LiveIndicator ─── CompletenessRing          │
│                                                         │
│  LeftPanel      CentralCanvas        RightPanel         │
│  (BPMN lib)     (bpmn-js modeler)    (Transcript +      │
│  (Patterns)     (ELK layout)          SIPOC questions)  │
│                                                         │
│  BottomBar ─── Tools ─── Auditar BPMN                   │
└─────────────────────────────────────────────────────────┘
```

## Rendering Pipeline

### 1. Incremental (during live session)
```
Transcript → extractProcessUpdates (Claude) → DiagramNode in DB
  → live-data polling (3s) → useLiveSession → mergeAiNodes
  → bpmn-js Modeling API (createShape, connect)
```

### 2. Full Rebuild (Reorganizar con IA)
```
POST /api/sessions/[id]/reorganize
  → Claude: evaluate nodes, fix connections, clean junk, generate narrative + gaps + completeness
  → Return: fixed nodes with correct connections

rebuildFromNodes(fixedNodes)
  → ELK: calculate positions (horizontal, orthogonal routing)
  → bpmn-js: importXML(empty) → createParticipantShape (Pool)
  → addLane for each role → createShape inside correct lane
  → connect all edges → applyBizagiColors → zoom fit
  → saveXML → POST to session (persists layout)
```

## Key Technical Decisions

### ✅ Use bpmn-js Modeling API for rendering
bpmn-js handles DI (diagram interchange) internally. Never generate `<bpmndi:BPMNShape>` XML manually.

### ✅ Use ELK for layout calculation
`elkjs/lib/elk.bundled.js` (not `elkjs` which needs `web-worker`). Horizontal direction, lane groups, orthogonal routing.

### ❌ Do NOT use `bpmn-auto-layout`
Only vertical layout, crashes with Collaboration/Pool, `reading 'di'` errors with certain XML structures.

### ❌ Do NOT generate XML with manual coordinates
Every attempt produced broken diagrams. Let bpmn-js compute its own DI.

### ✅ AI determines connections, not the builder
The builder only handles layout. The AI (Claude) in `/api/sessions/[id]/reorganize` determines the correct flow order.

## Node Type Mapping

AI returns camelCase, Prisma enum expects UPPER_SNAKE_CASE:

| AI Output | Prisma Enum |
|-----------|-------------|
| `startEvent` | `START_EVENT` |
| `endEvent` | `END_EVENT` |
| `task` | `TASK` |
| `userTask` | `USER_TASK` |
| `serviceTask` | `SERVICE_TASK` |
| `exclusiveGateway` | `EXCLUSIVE_GATEWAY` |
| `parallelGateway` | `PARALLEL_GATEWAY` |

Use `toNodeType()` function — never `.toUpperCase()` directly.

## Connection Wiring

### Problem: AI IDs ≠ DB IDs
AI returns `connectTo: "node_task_001"`. DB saves with cuid `"cmn4abc..."`.

### Solution: Two-pass creation
1. Create all nodes (get DB IDs)
2. Map AI IDs → DB IDs
3. Update connections with real IDs

### Fallback: Sequential order
If <30% of connections are valid, wire nodes sequentially: node1 → node2 → ... → end.

## BPMN Rules Enforced

1. Tasks/events: max 1 outgoing connection
2. Gateways: 2+ outgoing connections required
3. Start event: exactly 1 outgoing
4. Every path must reach an end event
5. Cycles broken by DFS (removes back-edges before layout)
6. Naming: tasks = verb+noun, gateways = question with ¿?

## Session End → Process Persistence

Priority for BPMN XML saved to ProcessDefinition:
1. **Session's saved XML** (from modeler.saveXML after Reorganizar) — has layout
2. **Generated from nodes** (buildBpmnXml) — no layout, fallback
3. **Existing process XML** — from previous sessions

## Dark Mode Canvas

The canvas needs `colorScheme: light` and `.bpmn-canvas-light` class to override the dark theme. Without it, the bpmn-js SVG inherits dark colors from ThemeProvider.

## Files

| File | Purpose |
|------|---------|
| `hooks/useBpmnModeler.ts` | Modeler lifecycle, mergeAiNodes, rebuildFromNodes |
| `hooks/useLiveSession.ts` | Polling hook (3s interval) |
| `lib/bpmn-builder.ts` | XML generation (async, ELK), exported helpers |
| `lib/bpmn-validator.ts` | Structural + best practices validation |
| `lib/bpmn-colors.ts` | Bizagi-inspired type-based coloring |
| `lib/patterns.ts` | Process pattern detection |
| `context/LiveSessionContext.tsx` | Shared state (sessionId, nodes, modelerApi) |
| `api/sessions/[id]/reorganize` | AI-powered smart reorganize |
| `api/sessions/[id]/transcript` | Manual input + extraction trigger |
| `api/sessions/[id]/live-data` | Polling endpoint (excludes REJECTED) |
| `prompts/process-extraction.ts` | BPMN methodology rules for AI |

## Known Issues

1. **Lanes**: shapes sometimes land in wrong lane (laneMap name lookup)
2. **Cycles**: valid process loops get broken by DFS
3. **Pattern Library**: creates nodes without lane → junk
4. **Completeness Ring**: only updates after Reorganizar (not live)
5. **ELK edge offsets**: bend points may need Pool header correction
