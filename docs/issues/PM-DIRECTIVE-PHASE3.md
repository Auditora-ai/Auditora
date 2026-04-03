# PM Directive — Phase 3: Crecimiento

**PM:** Agent #03
**Fecha:** 2026-04-03
**Target Dev:** Agent #04
**Status:** ACTIVE

---

## Execution Order

| Priority | Issue | Feature | Est. Effort | Rationale |
|----------|-------|---------|-------------|-----------|
| 0 | #46 | Panorama eval KPIs | **CLOSE** | Already done via #41 — RiskDashboard has eval KPIs. ClientDashboard is orphaned code. |
| 1 | #20 | F3-02: Notificaciones y gestión del cambio | L (3-4 days) | Foundation for everything. Collab, integrations, and onboarding all need notifications. |
| 2 | #19 | F3-01: Colaboración multi-usuario | XL (4-5 days) | Highest user impact — enables team workflow on processes. Depends on #20 for change notifications. |
| 3 | #22 | F3-04: Onboarding basado en evaluaciones | M (2-3 days) | Direct revenue driver — new employee evaluation flows. |
| 4 | #23 | F3-05: Programa de certificación | M (2-3 days) | Expansion revenue — renewals, org-wide compliance. |
| 5 | #21 | F3-03: Integraciones (Slack, Teams, GWS) | L (3-4 days) | Last — depends on #20 notification infra. Most external complexity. |

---

## Housekeeping: Close #46

**Verdict:** The RiskDashboard (the ACTUAL panorama page at `[organizationSlug]/page.tsx`) already has evaluaciones KPIs — org score, total simulations, members evaluated, completion rate, dimension progress bars, score trend sparkline. All added in #41.

The `ClientDashboard` component in `modules/dashboard/` is **orphaned** — never imported, never rendered. It was an alternate design that was superseded by RiskDashboard.

**Action:** Mark #46 as CLOSED in PROGRESS.md. No code changes needed. If Oscar wants ClientDashboard replaced or removed, that's a cleanup task, not a feature.

---

## Feature #20: F3-02 — Notificaciones y Gestión del Cambio

### Overview

"El procedimiento X cambió, 3 de 5 responsables no lo han confirmado."

This is the notification infrastructure + change management workflow. It's the backbone that F3-01 (collab), F3-03 (integrations), and F3-04 (onboarding) will all plug into.

### Data Model Changes (Prisma)

```prisma
// === NEW MODELS — add to schema.prisma ===

model Notification {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  recipientId     String
  recipient       User     @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  actorId         String?
  actor           User?    @relation("NotificationActor", fields: [actorId], references: [id])

  // Notification type enum
  type            NotificationType
  
  // Polymorphic reference to the source entity
  entityType      String   // "process" | "procedure" | "evaluation" | "comment" | "change_request"
  entityId        String
  
  // Display data (denormalized for fast rendering)
  title           String
  body            String
  url             String   // Deep link into the app
  
  // State
  read            Boolean  @default(false)
  readAt          DateTime?
  archived        Boolean  @default(false)
  
  // Email digest tracking
  emailSent       Boolean  @default(false)
  emailSentAt     DateTime?
  
  createdAt       DateTime @default(now())
  
  @@index([recipientId, read, createdAt])
  @@index([organizationId, createdAt])
  @@index([recipientId, emailSent])
}

enum NotificationType {
  // Change management
  PROCESS_UPDATED           // "Process X was updated"
  PROCEDURE_UPDATED         // "Procedure X was updated" 
  CHANGE_CONFIRMATION_REQUESTED  // "Please confirm you've read the changes to Process X"
  CHANGE_CONFIRMED          // "María confirmed changes to Process X"
  CHANGE_OVERDUE            // "3 of 5 responsables haven't confirmed Process X changes"
  
  // Evaluations
  EVALUATION_ASSIGNED       // "You've been assigned an evaluation on Process X"
  EVALUATION_COMPLETED      // "Carlos completed the evaluation on Process X"
  EVALUATION_RESULTS_READY  // "Results are ready for Process X evaluation batch"
  
  // Collaboration (used by F3-01)
  COMMENT_ADDED             // "María commented on Process X"
  COMMENT_MENTION           // "María mentioned you in a comment on Process X"
  
  // Onboarding (used by F3-04)
  ONBOARDING_ASSIGNED       // "You've been assigned onboarding for Process X"
  ONBOARDING_COMPLETED      // "Juan completed onboarding for Process X"
  
  // Certification (used by F3-05)
  CERTIFICATION_EARNED      // "Your team earned certification in Process X"
  CERTIFICATION_EXPIRING    // "Process X certification expires in 30 days"
  
  // System
  MEMBER_INVITED            // "You've been invited to join Organization X"
  WEEKLY_DIGEST             // Weekly summary
}

model ChangeConfirmation {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // What changed
  processId       String?
  process         ProcessDefinition? @relation(fields: [processId], references: [id])
  procedureId     String?
  procedure       Procedure? @relation(fields: [procedureId], references: [id])
  
  // Who initiated the change
  changedById     String
  changedBy       User     @relation("ChangeInitiator", fields: [changedById], references: [id])
  
  // Summary of what changed
  changeSummary   String   // AI-generated: "Steps 3 and 5 were modified, risk level increased"
  changeType      ChangeType
  
  // Tracking
  totalRequired   Int      // Total people who need to confirm
  totalConfirmed  Int      @default(0)
  deadline        DateTime? // Optional deadline for confirmation
  status          ChangeConfirmationStatus @default(PENDING)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  confirmations   ChangeConfirmationResponse[]
  
  @@index([organizationId, status])
  @@index([processId])
  @@index([procedureId])
}

enum ChangeType {
  PROCESS_STRUCTURE    // BPMN diagram changed
  PROCEDURE_CONTENT    // SOP text changed
  RISK_LEVEL_CHANGE    // Risk assessment changed
  RACI_CHANGE          // Responsibility matrix changed
}

enum ChangeConfirmationStatus {
  PENDING     // Waiting for confirmations
  COMPLETED   // All confirmed
  OVERDUE     // Past deadline, not all confirmed
  CANCELLED   // Change was reverted
}

model ChangeConfirmationResponse {
  id                    String   @id @default(cuid())
  changeConfirmationId  String
  changeConfirmation    ChangeConfirmation @relation(fields: [changeConfirmationId], references: [id], onDelete: Cascade)
  userId                String
  user                  User     @relation(fields: [userId], references: [id])
  
  confirmed             Boolean  @default(false)
  confirmedAt           DateTime?
  comment               String?  // Optional: "Noted, but I disagree with step 5 change"
  
  createdAt             DateTime @default(now())
  
  @@unique([changeConfirmationId, userId])
  @@index([userId, confirmed])
}

model NotificationPreference {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Per-category toggles
  inApp           Boolean  @default(true)
  email           Boolean  @default(true)
  
  // Digest frequency
  digestFrequency DigestFrequency @default(DAILY)
  
  // Muted types (JSON array of NotificationType strings)
  mutedTypes      String[] @default([])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([userId, organizationId])
}

enum DigestFrequency {
  REALTIME  // Send email immediately
  DAILY     // Daily digest at 9am user timezone
  WEEKLY    // Weekly digest on Monday
  NONE      // No email, in-app only
}
```

**Also add relations to existing models:**
```prisma
// On Organization model, add:
notifications           Notification[]
changeConfirmations     ChangeConfirmation[]
notificationPreferences NotificationPreference[]

// On User model, add:
notificationsReceived   Notification[] @relation("NotificationRecipient")
notificationsActed      Notification[] @relation("NotificationActor")
changeInitiated         ChangeConfirmation[] @relation("ChangeInitiator")
changeResponses         ChangeConfirmationResponse[]
notificationPreferences NotificationPreference[]

// On ProcessDefinition model, add:
changeConfirmations     ChangeConfirmation[]

// On Procedure model, add:
changeConfirmations     ChangeConfirmation[]
```

### API Endpoints (oRPC)

Create `packages/api/modules/notifications/` with:

```
packages/api/modules/notifications/
├── index.ts                    # Router export
├── procedures/
│   ├── list.ts                 # GET /notifications — paginated, filterable
│   ├── mark-read.ts            # POST /notifications/:id/read
│   ├── mark-all-read.ts        # POST /notifications/read-all
│   ├── count-unread.ts         # GET /notifications/unread-count
│   ├── preferences.ts          # GET/PUT /notifications/preferences
│   └── archive.ts              # POST /notifications/:id/archive
└── lib/
    ├── create-notification.ts  # Core: creates notification + triggers email if needed
    ├── digest-worker.ts        # Cron: sends daily/weekly digests
    └── change-tracker.ts       # Detects changes and creates ChangeConfirmations
```

Create `packages/api/modules/change-management/` with:

```
packages/api/modules/change-management/
├── index.ts
├── procedures/
│   ├── list-pending.ts         # GET /changes/pending — my unconfirmed changes
│   ├── confirm.ts              # POST /changes/:id/confirm
│   ├── get-status.ts           # GET /changes/:id/status — confirmation progress
│   └── create.ts               # POST /changes — trigger change confirmation flow
└── lib/
    └── auto-detect-changes.ts  # Hook into process/procedure save to auto-create
```

### UI Components

**Location:** `apps/saas/modules/notifications/`

```
apps/saas/modules/notifications/
├── components/
│   ├── NotificationBell.tsx        # Header icon with unread badge
│   ├── NotificationDropdown.tsx    # Click bell → dropdown list (last 20)
│   ├── NotificationItem.tsx        # Single notification row
│   ├── NotificationPage.tsx        # Full page: /notifications
│   ├── NotificationPreferences.tsx # Settings page component
│   └── ChangeConfirmationBanner.tsx # Banner: "Process X changed, review now"
├── hooks/
│   ├── use-notifications.ts        # TanStack Query: fetch + polling (30s)
│   └── use-unread-count.ts         # Lightweight poll for badge count
└── lib/
    └── notification-icons.ts       # Icon mapping per NotificationType
```

**Location:** `apps/saas/modules/change-management/`

```
apps/saas/modules/change-management/
├── components/
│   ├── ChangeConfirmationCard.tsx   # "Process X changed — Confirm you've read it"
│   ├── ChangeStatusTracker.tsx      # "3/5 confirmed" progress bar
│   ├── ChangeDiffViewer.tsx         # Side-by-side or inline diff of what changed
│   └── PendingChangesPanel.tsx      # List of pending confirmations for current user
├── hooks/
│   └── use-pending-changes.ts
└── lib/
    └── diff-generator.ts           # Generate human-readable diff from procedure versions
```

### Integration Points

1. **NavBar** — Add `NotificationBell` to the top header bar (right side, next to user avatar)
2. **Process save** — Hook `auto-detect-changes.ts` into the process/procedure save flow. When a process is saved and has RACI entries, auto-create ChangeConfirmation for all R/A/C/I users
3. **Settings** — Add "Notifications" tab to org settings with `NotificationPreferences`
4. **Panorama dashboard** — Add "Pending Changes" widget showing overdue confirmations

### Email Templates

Add to `packages/mail/emails/`:
- `change-confirmation.tsx` — "Process X changed, click to review"
- `notification-digest.tsx` — Daily/weekly summary email
- Use existing React Email patterns from the package

### Migration Plan

1. Create Prisma migration: `pnpm prisma migrate dev --name add-notifications-and-change-management`
2. Seed NotificationPreference defaults for existing org members
3. Wire NotificationBell into the header (shared layout)
4. Implement core notification creation service
5. Hook change detection into process/procedure save
6. Build UI components
7. Add email templates
8. Test full flow: edit process → notification created → bell shows badge → click → view change → confirm

---

## Feature #19: F3-01 — Colaboración Multi-Usuario en Procesos

### Overview

Real-time collaboration on process documentation. Multiple users can work on the same process simultaneously with presence indicators, edit locking, and change tracking.

**Depends on:** #20 (notifications) for change notifications and comments.

### Data Model Changes

```prisma
model ProcessPresence {
  id              String   @id @default(cuid())
  processId       String
  process         ProcessDefinition @relation(fields: [processId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // What they're looking at
  activeSection   String?  // "bpmn" | "procedure" | "raci" | "risks"
  activeNodeId    String?  // If editing a specific BPMN node
  
  // Cursor/viewport (for BPMN canvas)
  cursorX         Float?
  cursorY         Float?
  viewportJson    String?  // {x, y, zoom}
  
  lastSeen        DateTime @default(now())
  
  @@unique([processId, userId])
  @@index([processId, lastSeen])
}

model ProcessLock {
  id              String   @id @default(cuid())
  processId       String
  process         ProcessDefinition @relation(fields: [processId], references: [id], onDelete: Cascade)
  
  // What's locked
  section         String   // "bpmn" | "procedure" | "raci" | "risks" | "node:{nodeId}"
  
  // Who locked it
  lockedById      String
  lockedBy        User     @relation(fields: [lockedById], references: [id])
  
  // Auto-expire (prevents stale locks)
  lockedAt        DateTime @default(now())
  expiresAt       DateTime // lockedAt + 5 minutes, refreshed on heartbeat
  
  @@unique([processId, section])
  @@index([expiresAt])
}

model ProcessComment {
  id              String   @id @default(cuid())
  processId       String
  process         ProcessDefinition @relation(fields: [processId], references: [id], onDelete: Cascade)
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  
  // Where in the process
  section         String   // "bpmn" | "procedure" | "raci" | "risks" | "general"
  nodeId          String?  // Specific BPMN node
  procedureStepId String?  // Specific procedure step
  
  // Content
  body            String   // Markdown
  mentions        String[] // User IDs mentioned with @
  
  // Thread
  parentId        String?
  parent          ProcessComment? @relation("CommentThread", fields: [parentId], references: [id])
  replies         ProcessComment[] @relation("CommentThread")
  
  // State
  resolved        Boolean  @default(false)
  resolvedById    String?
  resolvedBy      User?    @relation("CommentResolver", fields: [resolvedById], references: [id])
  resolvedAt      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([processId, section, createdAt])
  @@index([processId, resolved])
}

model ProcessActivityLog {
  id              String   @id @default(cuid())
  processId       String
  process         ProcessDefinition @relation(fields: [processId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  action          String   // "edited_bpmn" | "edited_procedure" | "added_risk" | "updated_raci" | "commented" | "resolved_comment"
  section         String
  details         Json?    // {nodeId, field, oldValue, newValue} etc.
  
  createdAt       DateTime @default(now())
  
  @@index([processId, createdAt])
}
```

### API Endpoints

Create `packages/api/modules/collaboration/`:

```
packages/api/modules/collaboration/
├── procedures/
│   ├── presence-heartbeat.ts   # POST /processes/:id/presence — update presence, auto-expire stale
│   ├── get-presence.ts         # GET /processes/:id/presence — who's online
│   ├── acquire-lock.ts         # POST /processes/:id/lock — try to lock a section
│   ├── release-lock.ts         # DELETE /processes/:id/lock/:section
│   ├── add-comment.ts          # POST /processes/:id/comments
│   ├── list-comments.ts        # GET /processes/:id/comments?section=bpmn
│   ├── resolve-comment.ts      # POST /processes/:id/comments/:commentId/resolve
│   └── activity-log.ts         # GET /processes/:id/activity — recent changes
└── lib/
    ├── presence-manager.ts     # Cleanup stale presence (> 2 min), release expired locks
    └── mention-resolver.ts     # Parse @mentions, create notifications
```

### UI Components

**Location:** `apps/saas/modules/collaboration/`

```
apps/saas/modules/collaboration/
├── components/
│   ├── PresenceAvatars.tsx         # Row of avatar circles with colored rings (top of process workspace)
│   ├── PresenceCursors.tsx         # Colored cursors on BPMN canvas (optional, phase 2 of collab)
│   ├── EditLockBanner.tsx          # "María is editing this section" yellow banner
│   ├── CommentSidebar.tsx          # Right panel: threaded comments per section
│   ├── CommentBubble.tsx           # Single comment with reply, resolve actions
│   ├── AddCommentButton.tsx        # Floating button on BPMN nodes / procedure steps
│   ├── MentionInput.tsx            # @mention autocomplete in comment textarea
│   ├── ActivityTimeline.tsx        # "María edited step 3, Carlos added a risk" feed
│   └── CollaborationProvider.tsx   # Context provider: presence polling, lock management
├── hooks/
│   ├── use-presence.ts             # Poll every 15s, send heartbeat
│   ├── use-lock.ts                 # Acquire/release/check locks
│   └── use-comments.ts            # CRUD + real-time polling for comments
└── lib/
    └── presence-colors.ts          # Assign consistent colors to collaborators
```

### Integration Points

1. **ProcessDetailView** — Wrap with `CollaborationProvider`. Add `PresenceAvatars` to header.
2. **BPMN Editor** — Before editing, check/acquire lock. Show `EditLockBanner` if locked by someone else.
3. **Procedure Editor** — Same lock pattern. Show who's editing which step.
4. **Right sidebar** — Add "Comments" tab alongside existing tabs.
5. **Notifications (#20)** — `COMMENT_ADDED`, `COMMENT_MENTION` notification types.

### Polling Strategy (No WebSocket)

Use polling, not WebSockets. Reason: simpler infra, no persistent connections, works with serverless (Vercel/Railway).

- **Presence heartbeat:** POST every 15s from `CollaborationProvider`
- **Presence fetch:** GET every 15s (piggyback on heartbeat response)
- **Comments:** Poll every 30s when comment sidebar is open
- **Locks:** Check before edit, refresh every 60s while holding lock
- **Stale cleanup:** Server-side cron (or on-read cleanup) removes presence/locks older than 2 minutes

---

## Feature #22: F3-04 — Onboarding Basado en Evaluaciones

### Overview

New employee onboarding driven by process evaluations. Manager assigns processes, employee completes evaluations, manager tracks progress.

### Data Model Changes

```prisma
model OnboardingPlan {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Who
  assigneeId      String
  assignee        User     @relation("OnboardingAssignee", fields: [assigneeId], references: [id])
  assignedById    String
  assignedBy      User     @relation("OnboardingAssigner", fields: [assignedById], references: [id])
  
  name            String   // "Onboarding: Juan García — Compras"
  description     String?
  
  // Timeline
  startDate       DateTime @default(now())
  targetDate      DateTime?
  completedAt     DateTime?
  
  status          OnboardingStatus @default(IN_PROGRESS)
  
  // Progress
  totalSteps      Int      @default(0)
  completedSteps  Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  steps           OnboardingStep[]
  
  @@index([organizationId, status])
  @@index([assigneeId, status])
}

enum OnboardingStatus {
  IN_PROGRESS
  COMPLETED
  OVERDUE
  CANCELLED
}

model OnboardingStep {
  id              String   @id @default(cuid())
  onboardingPlanId String
  onboardingPlan  OnboardingPlan @relation(fields: [onboardingPlanId], references: [id], onDelete: Cascade)
  
  // What to do
  type            OnboardingStepType
  processId       String?
  process         ProcessDefinition? @relation(fields: [processId], references: [id])
  templateId      String?                    // SimulationTemplate to complete
  template        SimulationTemplate? @relation(fields: [templateId], references: [id])
  
  title           String
  description     String?
  
  // Order and state
  orderIndex      Int
  status          OnboardingStepStatus @default(PENDING)
  completedAt     DateTime?
  
  // Result link
  simulationRunId String?  // Once evaluation is completed
  simulationRun   SimulationRun? @relation(fields: [simulationRunId], references: [id])
  score           Float?   // Score achieved (if evaluation)
  passingScore    Float    @default(70) // Minimum to pass
  
  createdAt       DateTime @default(now())
  
  @@index([onboardingPlanId, orderIndex])
}

enum OnboardingStepType {
  READ_PROCESS       // "Read and understand Process X"
  READ_PROCEDURE     // "Read Procedure X"
  COMPLETE_EVALUATION // "Complete evaluation on Process X"
  CONFIRM_UNDERSTANDING // "Confirm you understand" (checkbox)
}

enum OnboardingStepStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED     // Evaluation score below passing
  SKIPPED
}
```

### API Endpoints

`packages/api/modules/onboarding-plans/`

```
├── procedures/
│   ├── create-plan.ts          # POST /onboarding-plans — manager creates plan
│   ├── list-plans.ts           # GET /onboarding-plans — manager sees all plans
│   ├── get-plan.ts             # GET /onboarding-plans/:id — plan detail
│   ├── my-plans.ts             # GET /onboarding-plans/mine — assignee's plans
│   ├── complete-step.ts        # POST /onboarding-plans/:id/steps/:stepId/complete
│   ├── update-plan.ts          # PUT /onboarding-plans/:id — edit plan
│   └── dashboard-stats.ts      # GET /onboarding-plans/stats — org-wide onboarding metrics
```

### UI Components

`apps/saas/modules/onboarding-plans/`

```
├── components/
│   ├── CreateOnboardingDialog.tsx   # Manager: select employee, pick processes, set target date
│   ├── OnboardingPlanList.tsx       # Manager: all active onboarding plans
│   ├── OnboardingPlanDetail.tsx     # Manager: see progress, scores, timeline
│   ├── MyOnboardingView.tsx         # Employee: my assigned plans, checklist style
│   ├── OnboardingStepCard.tsx       # Single step: read/evaluate with status
│   ├── OnboardingProgressBar.tsx    # Visual progress (3/7 steps complete)
│   └── OnboardingDashboard.tsx      # Org-wide: who's onboarding, avg time, completion rates
├── hooks/
│   └── use-onboarding-plans.ts
```

### Integration Points

1. **Evaluaciones module** — When a SimulationRun is completed and it's linked to an OnboardingStep, auto-update the step status/score
2. **Notifications (#20)** — `ONBOARDING_ASSIGNED`, `ONBOARDING_COMPLETED` types
3. **Panorama** — Widget showing active onboarding plans and progress
4. **Sidebar** — May need sub-item under "Evaluaciones" or separate "Onboarding" entry (discuss with Oscar)

---

## Feature #23: F3-05 — Programa de Certificación

### Overview

"Tu equipo está certificado en Proceso de Compras." Certification based on evaluation scores, with expiry and renewal.

### Data Model Changes

```prisma
model Certification {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // What process
  processId       String
  process         ProcessDefinition @relation(fields: [processId], references: [id])
  
  name            String   // "Certificación: Proceso de Compras"
  description     String?
  
  // Requirements
  passingScore    Float    @default(80)  // Minimum avg score to certify
  requiredEvals   Int      @default(1)   // How many evaluations must be passed
  
  // Expiry
  validityDays    Int      @default(365) // Certification valid for N days
  
  // Status
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  grants          CertificationGrant[]
  
  @@index([organizationId])
  @@index([processId])
}

model CertificationGrant {
  id              String   @id @default(cuid())
  certificationId String
  certification   Certification @relation(fields: [certificationId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Evidence
  simulationRunIds String[] // Runs that earned this certification
  avgScore         Float     // Average score across qualifying runs
  
  // Timeline
  grantedAt       DateTime @default(now())
  expiresAt       DateTime
  
  // Renewal
  renewedAt       DateTime?
  renewalCount    Int      @default(0)
  
  status          CertificationGrantStatus @default(ACTIVE)
  
  @@unique([certificationId, userId])
  @@index([userId, status])
  @@index([expiresAt, status])
}

enum CertificationGrantStatus {
  ACTIVE
  EXPIRED
  REVOKED
  RENEWED
}
```

### API Endpoints

`packages/api/modules/certifications/`

```
├── procedures/
│   ├── create-certification.ts     # Admin: define cert for a process
│   ├── list-certifications.ts      # List org's certification programs
│   ├── get-certification.ts        # Detail with grant stats
│   ├── grant-certification.ts      # Auto or manual: user earned cert
│   ├── check-eligibility.ts        # Can user X get certified in process Y?
│   ├── my-certifications.ts        # GET /certifications/mine — user's certs
│   └── expiring-soon.ts            # GET /certifications/expiring — certs expiring in 30 days
└── lib/
    ├── auto-certify.ts             # Hook: after evaluation, check if user qualifies
    └── expiry-checker.ts           # Cron: mark expired certs, send notifications
```

### UI Components

`apps/saas/modules/certifications/`

```
├── components/
│   ├── CertificationProgramList.tsx    # Admin: manage certification programs
│   ├── CreateCertificationDialog.tsx   # Admin: pick process, set passing score, validity
│   ├── CertificationStatusCard.tsx     # "80% of your team is certified in Compras"
│   ├── CertificationBadge.tsx          # Visual badge/shield icon
│   ├── MyCertificationsView.tsx        # User: my certs with expiry dates
│   ├── CertificationDetail.tsx         # Who's certified, who's not, expiring soon
│   ├── RenewalPrompt.tsx              # "Your certification expires in 15 days. Retake evaluation?"
│   └── CertificationReport.tsx         # Exportable: team certification status
├── hooks/
│   └── use-certifications.ts
```

### Integration Points

1. **Evaluation completion** — After SimulationRun completion, check if user qualifies for any certification
2. **Notifications (#20)** — `CERTIFICATION_EARNED`, `CERTIFICATION_EXPIRING` types
3. **Member profiles** — Show certification badges
4. **Panorama** — "Team Certification Status" widget
5. **Reports (#18)** — Include certification status in exportable reports

---

## Feature #21: F3-03 — Integraciones (Slack, Teams, Google Workspace)

### Overview

Webhook-based notifications to external tools. Build on top of #20 notification infrastructure.

**Note:** This is last priority. Spec will be detailed when #20 and #19 are complete. High-level:

### Data Model

```prisma
model Integration {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  type            IntegrationType
  name            String
  
  // OAuth
  accessToken     String?  @db.Text // Encrypted
  refreshToken    String?  @db.Text // Encrypted
  tokenExpiresAt  DateTime?
  
  // Webhook
  webhookUrl      String?
  
  // Channel mapping
  channelConfig   Json?    // {"default": "#auditora", "processes": "#processes", ...}
  
  // Event subscriptions
  subscribedEvents String[] // ["PROCESS_UPDATED", "EVALUATION_COMPLETED", ...]
  
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([organizationId, type])
}

enum IntegrationType {
  SLACK
  MICROSOFT_TEAMS
  GOOGLE_WORKSPACE
  WEBHOOK_CUSTOM
}
```

### Implementation Approach

1. Start with `WEBHOOK_CUSTOM` — simplest, covers power users
2. Add Slack (Incoming Webhooks, then OAuth app)
3. Add Teams (Incoming Webhook connector)
4. Google Workspace (Calendar for deadlines, optional)

Full spec will be written when Dev starts this feature.

---

## Dev Agent #04 Instructions

### Immediate Actions (this cycle)

1. **Close #46** — No code needed. Already done via #41.
2. **Start #20 (Notifications)** — Begin with:
   a. Prisma schema migration (all models from this spec)
   b. Core `create-notification.ts` service
   c. `NotificationBell` + `NotificationDropdown` UI
   d. Wire into header layout
   e. Change management models + auto-detection on process save
   f. Email templates

### Code Quality Reminders

- Follow existing oRPC patterns in `packages/api/modules/`
- Use protectedProcedure for all endpoints
- Add translations for en/es (at minimum) 
- All new components: `"use client"` only when needed
- Polling via TanStack Query with `refetchInterval`
- Run `pnpm build` before considering any feature done

---

*End of Phase 3 Directive — PM Agent #03*
