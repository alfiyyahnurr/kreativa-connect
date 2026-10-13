# PRD — Kreativa Connect
**Product Requirements Document**
Version 1.0 | October 2026
Kreativa Global School — Parent Communication CRM

---

## 1. Product Overview

### 1.1 Vision
Kreativa Connect is a centralised parent communication management system for Kreativa Global School. It consolidates incoming messages from multiple WhatsApp channels into one operational dashboard, automates first responses via a branching chatbot with optional AI assistance, and tracks every parent interaction from first inquiry through enrollment completion.

### 1.2 Problem Statement
- Parents contact the school via at least 4 separate WhatsApp numbers (Admission, KG PRO, Primary PRO, Secondary & HS PRO).
- School staff have no unified view of conversation history, resulting in duplicated effort and missed follow-ups.
- There is no structured admission pipeline tracking alongside chat history.
- Responses are inconsistent because there is no approved FAQ/knowledge base enforced at the point of reply.

### 1.3 Goals
1. Reduce first-response time to ≤ 15 minutes during operating hours.
2. Ensure 100% of open conversations have an assigned PIC and a clear status.
3. Automate answers for ≥ 60% of common inquiries via chatbot.
4. Provide admission stage visibility from registration to enrollment.
5. Generate weekly SLA and workload reports with zero manual effort.

### 1.4 Scope
This document covers:
- **Admin Panel** — web-based CRM for school staff.
- **Public Live Chat Widget** — embeddable chat interface for parents on the school website.
- **Chatbot Engine** — branching suggestion tree + optional AI (LLM) fallback.

Out of scope (Phase 2):
- Native mobile app.
- Actual WhatsApp Business API integration (Phase 1 uses simulated channels).
- Payment gateway integration.
- Student information system (SIS) bidirectional sync.

---

## 2. User Roles & Permissions

| Role | Description | Key Capabilities |
|---|---|---|
| **Super Admin** | IT / School Management | All access, manage users, configure channels, view all reports |
| **Admission PIC** | Admission team member | Handle Admission channel conversations, manage admission pipeline |
| **Class PRO (Teacher)** | Homeroom / PRO per level | Handle level-specific channel (KG / Primary / Secondary-HS), view assigned contacts only |
| **Finance** | Finance team | Handle payment-related escalations, mark payment verified |
| **Academic** | Academic team | Handle test result inquiries |
| **Parent (Public)** | Parent or prospective parent | Use public live chat widget only |

---

## 3. Features

### 3.1 Admin Panel

#### 3.1.1 Dashboard (Overview)
**Description:** Command-centre view of today's activity.

**Requirements:**
- F-001: Display 4 KPI cards — Total Conversations, New (Unhandled), In Progress, Completed.
- F-002: Display count of overdue follow-up tasks prominently (red badge).
- F-003: Show a feed of the 5 most recently updated open conversations.
- F-004: Show a bar chart of conversations grouped by education level.
- F-005: Show SLA compliance percentage (conversations with first human response <= SLA target).
- F-006: Show 3 quick-action shortcuts: Tasks, Admission, Chatbot Simulator.
- F-007: Dashboard data must refresh automatically every 60 seconds.

#### 3.1.2 Inbox (Conversation Management)
**Description:** Unified inbox for all parent conversations across channels.

**Requirements:**
- F-010: Display all conversations in a scrollable list sorted by `updated_at` descending.
- F-011: Each conversation item shows: parent name, channel, last message snippet, time ago, status badge, high-priority flag.
- F-012: Filter conversations by: status, channel, assigned PIC, free-text search (parent name, child name, topic).
- F-013: Three-column layout: conversation list | chat thread | context panel.
- F-014: Chat thread shows all messages with visual distinction: parent message (white), agent message (purple), internal note (yellow dashed).
- F-015: Agents can send a reply (marked as agent message, recorded in DB).
- F-016: Agents can add an internal note (visible to staff only, not sent to parent).
- F-017: Context panel allows changing: status, assigned PIC, priority, without leaving inbox.
- F-018: Context panel shows: parent type (Prospective / Active), education level, admission stage, link to parent profile.
- F-019: Status change from "new" to "in_progress" automatically when agent sends first reply.
- F-020: First human response time is recorded in seconds from first parent message to first agent reply.

**Conversation Statuses:** `new` | `in_progress` | `pending_internal` | `pending_parent` | `needs_followup` | `closed`

#### 3.1.3 Admission Pipeline
**Description:** Kanban-style view of all prospective parents through the enrollment funnel.

**Requirements:**
- F-030: Four kanban columns: Inquiring | In Selection Process | Accepted & Confirming | Enrolled.
- F-031: Each card shows student name, parent name, level, stage label, lead temperature badge (Hot/Warm/Cold).
- F-032: Clicking a card opens the parent profile modal.
- F-033: Detail table below kanban lists all prospects with sortable columns and stage editing.
- F-034: Stage changes are recorded with timestamp and user in `admission_logs`.
- F-035: Add new prospective student via modal form.
- F-036: Search/filter prospects by name, level, stage.

**Admission Stages (10):**
`registered` > `assessment_scheduled` > `assessment_completed` > `parent_interview` > `selection_result` > `accepted` > `confirmation_letter_pending` > `first_payment_pending` > `payment_verification` > `enrollment_completed`

#### 3.1.4 Contacts (Parent Profiles)
**Requirements:**
- F-040: List all contacts (prospective + active parents) in a searchable table.
- F-041: Each contact record stores: parent name, child name, WhatsApp phone, level, type, admission stage, lead temp, assigned PIC, email, internal notes.
- F-042: Contact detail modal shows: editable profile fields + conversation history summary.
- F-043: Add new contact via modal.
- F-044: Contact type: `prospective` | `active_parent`.

#### 3.1.5 Tasks (Follow-up Management)
**Requirements:**
- F-050: List all tasks with filter: Active | Overdue | Completed | All.
- F-051: Each task links to a contact and optionally a conversation.
- F-052: Task fields: title, assigned PIC, due datetime, is_done.
- F-053: Tasks past due date and not done are highlighted in red.
- F-054: Mark task done / reopen with single click.
- F-055: KPI cards: pending, overdue, completed.
- F-056: New task can be created from inbox context panel or standalone.

#### 3.1.6 Knowledge Base (FAQ)
**Requirements:**
- F-060: Grid of FAQ cards with search and level filter.
- F-061: Each FAQ: title, category, education level scope, approved answer text, active/inactive toggle.
- F-062: Active FAQs are served by the chatbot engine automatically.
- F-063: Only Super Admin or Admission PIC can create/edit/approve FAQs.
- F-064: Inactive FAQs are not served to parents but are visible to staff.
- F-065: 12 default seed FAQs.

#### 3.1.7 Chatbot Flow Editor (Branching Tree)
**Description:** List-based editor for the branching suggestion tree that powers the public live chat widget.

**Requirements:**
- F-070: The chatbot flow is a **directed tree** of nodes stored in the database.
- F-071: Each **node** has: message text shown to parent, node_type (`message` | `question` | `faq_answer` | `ai_response` | `handover` | `end`), optional linked FAQ.
- F-072: Each node can have multiple **options** (buttons shown to parent). Each option has: display label, sort order, and pointer to the next node.
- F-073: Root node is the initial greeting sent when a parent opens the chat widget (is_root = true).
- F-074: A node of type `faq_answer` renders the linked FAQ's approved answer text.
- F-075: A node of type `ai_response` sends the parent's last free-text input to an LLM API and returns the response as a bot message.
- F-076: A node of type `handover` creates a new conversation record and task in the CRM inbox.
- F-077: Staff can add/edit/reorder nodes and options from the admin panel.
- F-078: Changes to the flow take effect immediately without deployment.
- F-079: Every parent interaction with the chatbot is stored in `chatbot_sessions` and `chatbot_messages`.

#### 3.1.8 Reports
**Requirements:**
- F-080: KPI stats: total conversations, avg first response (minutes), median first response, SLA compliance %.
- F-081: Bar chart: conversations per channel.
- F-082: Status breakdown list.
- F-083: PIC workload table: total, pending, new per user.
- F-084: All report data filterable by date range.
- F-085: Export raw data as JSON or CSV.

#### 3.1.9 Settings
**Requirements:**
- F-090: Configure operating hours (start time, end time, operating days).
- F-091: Configure SLA target (minutes for first response).
- F-092: Configure chat routing rules per channel -> assigned team/user.
- F-093: Toggle: alerts for overdue tasks, auto-reply outside operating hours.
- F-094: Configure AI provider, API key, system prompt.
- F-095: Display integration status placeholders (WhatsApp API, Admission Portal, Student DB).

---

### 3.2 Public Live Chat Widget

**Description:** An embeddable or standalone chat interface for parents, powered by the chatbot branching tree with optional AI fallback.

**Requirements:**
- F-100: Widget loads via `<script>` embed on any website page or as a standalone URL.
- F-101: Parent opens widget -> receives root node greeting automatically.
- F-102: Widget renders current node message text and option buttons.
- F-103: Parent selects an option -> widget advances to the linked next node, stores parent choice in `chatbot_messages`.
- F-104: If no options exist and node type is `ai_response`, widget shows a free-text input field.
- F-105: Free-text input is sent to AI endpoint; response is displayed as a bot message and stored.
- F-106: If node type is `handover`, widget shows confirmation message; a new CRM conversation and task are created.
- F-107: Session identified by a session token stored in browser `localStorage`. Returning parents within session TTL (24 hours) continue the same session.
- F-108: Widget shows full conversation history of the active session.
- F-109: Mobile-first responsive layout.
- F-110: All messages (bot and parent choices) stored in `chatbot_messages` linked to `chatbot_sessions`.
- F-111: If handover occurs, `chatbot_sessions.conversation_id` is set to the created CRM conversation.

---

### 3.3 Chatbot Engine Logic

```
PARENT OPENS WIDGET
  └─ Load root node (is_root = true)
       └─ Display node.message_text as bot message
            └─ If node has chatbot_flow_options
            |    └─ Render option buttons
            |         └─ Parent clicks button
            |              └─ Record chatbot_message (role = 'user', content = option label)
            |                   └─ Load option.next_node_id -> repeat
            └─ If node.node_type = 'faq_answer'
            |    └─ Render linked faq.answer as bot message
            └─ If node.node_type = 'ai_response'
            |    └─ Show free-text input
            |         └─ POST parent text to /api/ai/chat with system prompt + session history
            |              └─ Record AI response as chatbot_message (role = 'bot', source = 'ai')
            └─ If node.node_type = 'handover'
            |    └─ POST /api/conversations to create CRM conversation
            |         └─ POST /api/tasks to create follow-up task
            |              └─ Link chatbot_session.conversation_id to new conversation
            └─ If node.node_type = 'end'
                 └─ Show closing message, disable input
```

**AI Integration:**
- Provider & Tier: **Direct Google Gemini API (Free Tier via Google AI Studio)** — 100% gratis tanpa biaya gateway, menyediakan kuota 15 RPM, 1.500 RPD, dan 1M TPM.
- Default AI Model: **Google Gemini (`gemini-1.5-flash`)** powered by Vercel AI SDK (`ai` & `@ai-sdk/google`).
- System prompt stored per school in `settings.ai_system_prompt` with dynamic grounding from verified `fee_structures`, `fee_items`, and active `faqs`.
- Conversation context (last N messages from session) sent with each AI streaming request.
- AI response stored as `chatbot_messages` with `source = 'ai'`.
- Fallback text shown if AI API is unavailable (`chatbot_flow_nodes.ai_fallback_text`).

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Dashboard and inbox load in < 1.5 s for up to 10,000 conversations |
| **Concurrency** | Support 50 simultaneous agent sessions and 200 simultaneous parent chat sessions |
| **Availability** | 99.5% uptime during school operating hours (Mon-Fri 07:00-17:00 WIB) |
| **Security** | All admin routes authenticated (JWT Bearer). Parent sessions use anonymous tokens. PII fields encrypted at rest. |
| **Audit** | All data mutations logged in `activity_logs` with actor, timestamp, old_value, new_value |
| **Scalability** | All tenant-scoped tables include `school_id` for future multi-school support |
| **Search** | Full-text search on conversations and contacts via PostgreSQL `tsvector` + `GIN` index |
| **Real-time** | Inbox and chatbot widget use WebSocket (Socket.io) or Server-Sent Events for live updates |
| **API** | RESTful JSON API, versioned at `/api/v1/` |

---

## 5. Out of Scope (Phase 1)

- Real WhatsApp Business API integration
- Email or SMS channel support
- Student grade or attendance data
- Parent mobile app
- Automated payment verification
- Multi-language interface