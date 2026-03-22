# Feature Specification: Core Meeting Engine

**Feature Branch**: `001-core-meeting-engine`
**Created**: 2026-03-22
**Status**: Draft
**Input**: Phase 1 of Prozea — live process elicitation with auto-diagramming

## User Scenarios & Testing

### User Story 1 - Live Process Diagramming (Priority: P1)

As a BPM consultant, I start a Prozea session with a meeting link. A bot joins my video call, listens to the conversation, and auto-generates a BPMN process diagram in real-time. I see nodes appear as process steps are discussed, and I can confirm or reject them.

**Why this priority**: This is the core value proposition. Without live diagramming, there is no product.

**Independent Test**: Can be tested by feeding a recorded transcript and verifying BPMN nodes appear in the diagram within 8 seconds.

**Acceptance Scenarios**:

1. **Given** a consultant creates a session with a Zoom meeting URL, **When** the bot joins and participants start discussing a process, **Then** BPMN nodes appear in the diagram within 8 seconds of each process step being mentioned.
2. **Given** the AI generates a new node, **When** the consultant clicks "confirm", **Then** the node transitions from dashed/forming to solid/confirmed state.
3. **Given** the AI generates an incorrect node, **When** the consultant clicks "reject", **Then** the node and its children transition to rejected/forming state.
4. **Given** no one contradicts a forming node for 10 seconds, **Then** the node auto-confirms.

---

### User Story 2 - Teleprompter Guided Questions (Priority: P1)

As a BPM consultant during a live call, I see a teleprompter panel showing me the next question to ask. The questions adapt based on what has already been discussed and what gaps remain in the process diagram.

**Why this priority**: The teleprompter is what makes Prozea different from "recording + AI summary." It guides the conversation to produce a complete diagram.

**Independent Test**: Can be tested by feeding a partial transcript and verifying the teleprompter suggests relevant follow-up questions about uncovered process areas.

**Acceptance Scenarios**:

1. **Given** a session is active and participants are discussing a process, **When** a process gap is detected (e.g., no exception handling discussed), **Then** the teleprompter suggests a question like "What happens if the order is rejected?"
2. **Given** the current BPMN diagram has an open gateway with only one path, **When** the teleprompter updates, **Then** it prioritizes asking about the alternative path.

---

### User Story 3 - Session Management (Priority: P1)

As a consultant, I can create sessions (Discovery or Deep-Dive), view my session history, and access completed diagrams from past sessions.

**Why this priority**: Without session management, there's no way to organize work or return to past results.

**Independent Test**: Can be tested by creating a session, ending it, and verifying it appears in session history with the correct diagram.

**Acceptance Scenarios**:

1. **Given** a consultant is on the dashboard, **When** they click "New Session", **Then** they see a form to enter meeting URL, client name, and session type (Discovery/Deep-Dive).
2. **Given** a session has ended, **When** the consultant views the dashboard, **Then** the session appears in history with client name, date, process name, and node count.

---

### User Story 4 - BPMN Export (Priority: P2)

As a consultant, after a session I can export the process diagram as BPMN 2.0 XML (for import into Visio/Lucidchart) or as PNG (for presentations/emails).

**Why this priority**: Export is the deliverable — what the consultant gives to the client. Essential but depends on the diagram being created first.

**Independent Test**: Can be tested by loading a completed diagram and verifying the exported XML is valid BPMN 2.0 and the PNG renders correctly.

**Acceptance Scenarios**:

1. **Given** a session with a completed diagram, **When** the consultant clicks "Export BPMN XML", **Then** a valid BPMN 2.0 XML file is downloaded.
2. **Given** a session with a completed diagram, **When** the consultant clicks "Export PNG", **Then** a high-resolution PNG of the diagram is downloaded.

---

### User Story 5 - Discovery Session Mode (Priority: P2)

As a consultant doing an initial engagement, I run a Discovery Session where the AI maps the overall business model and creates a process architecture — a high-level map of all processes the company has. Future Deep-Dive sessions then target individual processes from this architecture.

**Why this priority**: The multi-session workflow mirrors how real BPM consulting works and differentiates Prozea from single-meeting tools.

**Independent Test**: Can be tested by running a Discovery Session, verifying a process architecture is created, then starting a Deep-Dive session that inherits context from the architecture.

**Acceptance Scenarios**:

1. **Given** a consultant starts a Discovery Session, **When** participants describe their business, **Then** the AI creates a process architecture (list of identified processes with brief descriptions).
2. **Given** a Discovery Session has identified 5 processes, **When** the consultant creates a new Deep-Dive Session, **Then** they can select which process to focus on and the teleprompter loads context from the architecture.

---

### Edge Cases

- What happens when the bot can't join the meeting (wrong URL, blocked by host)?
- How does the system handle 3+ hours meetings (memory, cost)?
- What happens when Deepgram/Claude API goes down mid-meeting?
- What if the conversation is not about processes (small talk, introductions)?
- What if two process steps are discussed simultaneously?
- What if the consultant's internet drops and reconnects?

## Requirements

### Functional Requirements

- **FR-001**: System MUST join a video call (Zoom/Meet/Teams) via Recall.ai bot within 30 seconds of session start
- **FR-002**: System MUST transcribe speech in real-time with speaker diarization via Deepgram
- **FR-003**: System MUST extract process steps from transcript and generate BPMN nodes via Claude API within 8 seconds
- **FR-004**: System MUST render BPMN diagram using bpmn-js Modeler in restricted mode
- **FR-005**: System MUST support node lifecycle: forming → confirmed/rejected with auto-confirm after 10s
- **FR-006**: System MUST cascade rejection (rejecting parent moves children to forming)
- **FR-007**: System MUST run parallel AI pipelines (process extraction + teleprompter) independently
- **FR-008**: System MUST use sliding window context (last 5 min transcript + current BPMN state) for LLM calls
- **FR-009**: System MUST support Discovery Session and Deep-Dive Session modes
- **FR-010**: System MUST export diagrams as BPMN 2.0 XML and PNG
- **FR-011**: System MUST show graceful degradation with status indicators when external services fail
- **FR-012**: System MUST log all node corrections for future AI learning pipeline
- **FR-013**: System MUST use BullMQ with Redis for priority queuing (extraction > teleprompter)
- **FR-014**: System MUST use Supabase Realtime Broadcast for AI Worker → Browser communication

### Key Entities

- **Session**: A meeting session (Discovery or Deep-Dive) with meeting URL, client, timestamps, status
- **ProcessArchitecture**: High-level map of identified processes (from Discovery session)
- **ProcessDefinition**: A single process identified within an architecture
- **DiagramNode**: A BPMN node with id, type, label, state (forming/confirmed/rejected), lane, position
- **Transcript**: Utterances with speaker identification, timestamps, text
- **CorrectionLog**: Record of consultant corrections (reject, confirm, edit) for AI learning
- **TeleprompterLog**: Questions shown, whether used or skipped

## Success Criteria

### Measurable Outcomes

- **SC-001**: Diagram updates appear within 8 seconds of a process step being mentioned
- **SC-002**: At least 70% of AI-generated nodes are confirmed (not rejected) by the consultant
- **SC-003**: Exported BPMN XML validates against the BPMN 2.0 schema
- **SC-004**: System handles 1-hour meetings without performance degradation
- **SC-005**: Graceful degradation activates within 2 seconds of any external service failure
