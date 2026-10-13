# CLAUDE.md — Kreativa Connect Engineering Guide

This document defines the strict engineering standards, architectural commandments, and coding conventions for AI assistants and software engineers working on **Kreativa Connect**.

---

## 1. Core Architectural Commandments

### 1. No SPA — Server-Side Rendering (SSR) Only
- This project is strictly **NOT a Single Page Application (SPA)**.
- Built on **Next.js App Router** with React Server Components (RSC) and dynamic SSR for instant loading speed, zero initial hydration waterfalls, and top-tier SEO performance.
- Any raw HTML or JSX files in prototype folders are strictly **reference prototypes** only. Production code must be written as idiomatic Next.js App Router code.

### 2. Pure Raw SQL — Zero ORM Runtime
- **Drizzle is restricted strictly to migrations and idempotent seeds**.
- You must **NEVER** use Drizzle's query builder (`db.select()`, `db.insert()`, `db.query`) or any other ORM (Prisma, TypeORM) at application runtime.
- All queries must be executed via parameterized raw SQL using `@neondatabase/serverless` (`sql` tagged template).

### 3. Strict Separation of Concerns (No Inline SQL in Components)
- **Zero raw SQL queries inside React components**.
- **Zero raw SQL queries inline inside API route handlers**.
- All queries must be housed in dedicated repository files under `lib/queries/{model}.ts`.
- API route handlers (`app/api/{model}/route.ts`) import query functions from `lib/queries/`, perform Zod validation, handle Upstash caching, and return standard JSON.
- Server Components call `lib/queries/` functions directly during server rendering.

### 4. Vercel & Serverless Native
- Deployed on **Vercel** with serverless and edge compute.
- All uploads and binary assets are stored in **Vercel Blob Storage** (`@vercel/blob`).
- Distributed caching, rate-limiting, and session management are powered by **Upstash Redis** (`@upstash/redis`).

---

## 2. Directory Structure

```
kreativa-connect/
├── app/
│   ├── (admin)/                     # Staff CRM dashboard (SSR Layout)
│   │   ├── layout.tsx               # Admin shell layout
│   │   ├── dashboard/page.tsx       # KPI overview & SLA metrics
│   │   ├── inbox/page.tsx           # Multi-channel conversation inbox
│   │   ├── pipeline/page.tsx        # Admission Kanban (dnd-kit)
│   │   ├── contacts/page.tsx        # Parent CRM & student directory
│   │   ├── fees/page.tsx            # Multi-campus fee manager
│   │   ├── knowledge/page.tsx       # FAQ & Knowledge editor (tiptap)
│   │   ├── analytics/page.tsx       # Recharts SLA reports
│   │   └── settings/page.tsx        # Operating hours & AI configuration
│   ├── (widget)/                    # Public live chat widget
│   │   └── chat-widget/page.tsx     # Embeddable parent chat widget
│   ├── api/                         # REST API route handlers
│   │   ├── conversations/route.ts
│   │   ├── conversations/[id]/messages/route.ts
│   │   ├── contacts/route.ts
│   │   ├── admission/route.ts
│   │   ├── tasks/route.ts
│   │   ├── fees/route.ts
│   │   ├── chatbot/nodes/route.ts
│   │   ├── chatbot/session/route.ts
│   │   ├── ai/chat/route.ts         # Streaming AI chat handler (Vercel AI SDK)
│   │   └── upload/route.ts
│   ├── layout.tsx                   # Root HTML & metadata layout
│   └── globals.css                  # Global design tokens & CSS variables
├── components/                      # Modular, reusable UI components
│   ├── ui/                          # Atoms (Button, Badge, Modal, Input, Card)
│   ├── pipeline/                    # Kanban components (@dnd-kit)
│   ├── analytics/                   # Data visualizer cards (Recharts)
│   ├── editor/                      # Rich text editor (@tiptap)
│   ├── chat/                        # Message bubble, channel selector
│   └── widget/                      # Branching suggestion buttons, fee cards
├── lib/                             # Core server utilities
│   ├── db/
│   │   ├── neon.ts                  # Neon DB serverless client
│   │   └── external-dbs.ts          # Secondary connection pools (.env)
│   ├── ai/
│   │   └── gemini.ts                # Direct Google Gemini (Free Tier) client
│   ├── redis/
│   │   ├── client.ts                # Upstash Redis client
│   │   ├── cache.ts                 # Cache-aside helper (redisGetOrSet)
│   │   └── ratelimit.ts             # Upstash Rate Limiter
│   ├── blob/
│   │   └── storage.ts               # Vercel Blob helpers
│   ├── queries/                     # Data Access Layer (RAW SQL ONLY)
│   │   ├── conversations.ts
│   │   ├── messages.ts
│   │   ├── contacts.ts
│   │   ├── admission.ts
│   │   ├── fees.ts
│   │   ├── chatbot.ts
│   │   └── tasks.ts
│   ├── pdf/                         # @react-pdf/renderer document templates
│   └── excel/                       # xlsx export helpers
├── drizzle/                         # Migration & Seed files ONLY
│   ├── schema.ts                    # Drizzle schema definitions for migrations
│   ├── migrations/                  # Generated SQL migrations
│   └── seed.ts                      # Idempotent realistic seed script
└── package.json
```

---

## 3. Technology & Dependency Standards

| Technology | Usage Rule |
|---|---|
| **Next.js (App Router)** | Default to Server Components (`async function Page()`). Mark client components with `'use client'` only when state (`useState`), browser events (`onClick`), or browser APIs are required. |
| **Neon PostgreSQL** | Always use tagged template literals (`sql\`SELECT ... WHERE id = ${id}\``). Never concatenate raw strings to avoid SQL injection. |
| **Upstash Redis** | Cache read-heavy endpoints (Fees, FAQs, Root Nodes) using `redisGetOrSet(key, ttl, fetcher)`. Invalidate on mutations. |
| **Vercel Blob** | Always use `@vercel/blob` via `put()` with `access: 'public'`. Store the returned HTTPS URL in database columns. |
| **@dnd-kit** | Isolate Kanban board in client component. Handle optimistic updates before dispatching server action or `PATCH /api/admission`. |
| **Recharts** | Wrap chart components in `ResponsiveContainer`. Lazy-load client components using `next/dynamic` where appropriate. |
| **Tiptap** | Provide rich-text formatting for Knowledge Base and Canned Responses. Persist HTML or JSON content. |
| **xlsx** | Use SheetJS for generating tabular reports from raw database query arrays. |
| **@react-pdf/renderer** | Compile clean, branded PDF brochures and official admission confirmation letters. |
| **Google Gemini (Free Tier)** | Connect Google Gemini (`gemini-1.5-flash`) directly via `@ai-sdk/google` & `ai` (Google AI Studio Free Tier — 100% gratis). Stream tokens via `streamText()`, enforce low temperature (0.2), and ground queries in verified raw SQL fee data. |

---

## 4. How to Implement a New Model / Feature

Follow this strict 4-step sequence:

### Step 1: Migration & Seed (Drizzle)
1. Add table definition to `drizzle/schema.ts` (using BigSerial, Varchar with check, Explicit FKs, High-traffic indexes).
2. Generate migration: `npx drizzle-kit generate`.
3. Add idempotent seed logic in `drizzle/seed.ts` (using `ON CONFLICT DO NOTHING`).

### Step 2: Raw SQL Repository (`lib/queries/{model}.ts`)
1. Create TypeScript interfaces representing database row output.
2. Export parameterized `async` functions using `sql` from `@/lib/db/neon`.
3. Ensure all sorting and filtering utilize database indexes.

### Step 3: REST API Handler (`app/api/{model}/route.ts`)
1. Validate input using `zod`.
2. Wrap read queries with Upstash Redis cache-aside if read-heavy.
3. Return uniform responses: `{ success: true, data: ... }` or `{ success: false, error: ... }`.

### Step 4: Reusable UI Component (`components/`)
1. Build reusable components adhering to established design system styles.
2. Keep Server Components for initial fetch; isolate interactive parts into client components.

---

## 5. Coding Conventions & Code Snippets

### Raw SQL Query Example (`lib/queries/conversations.ts`)
```typescript
import { sql } from '@/lib/db/neon';

export interface ConversationSummary {
  id: number;
  contact_id: number;
  contact_name: string;
  phone: string;
  channel_name: string;
  status: string;
  priority: string;
  last_message_snippet: string | null;
  updated_at: string;
}

export async function getOpenConversations(
  schoolId: number,
  limit: number = 20,
  offset: number = 0
): Promise<ConversationSummary[]> {
  const rows = await sql`
    SELECT
      c.id,
      c.contact_id,
      ct.full_name AS contact_name,
      ct.phone,
      ch.name AS channel_name,
      c.status,
      c.priority,
      m.content AS last_message_snippet,
      c.updated_at
    FROM conversations c
    INNER JOIN contacts ct ON c.contact_id = ct.id
    INNER JOIN channels ch ON c.channel_id = ch.id
    LEFT JOIN LATERAL (
      SELECT content
      FROM messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON TRUE
    WHERE c.school_id = ${schoolId}
      AND c.status NOT IN ('closed')
    ORDER BY c.updated_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as ConversationSummary[];
}
```

### Route Handler Example (`app/api/conversations/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getOpenConversations } from '@/lib/queries/conversations';
import { z } from 'zod';

const QuerySchema = z.object({
  school_id: z.coerce.number().default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { school_id, limit, offset } = parsed.data;
    const conversations = await getOpenConversations(school_id, limit, offset);

    return NextResponse.json({ success: true, data: conversations });
  } catch (error: any) {
    console.error('API Error /api/conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve conversations' },
      { status: 500 }
    );
  }
}
```

### AI Streaming Route Example (`app/api/ai/chat/route.ts`)
```typescript
import { streamText } from 'ai';
import { defaultGeminiModel } from '@/lib/ai/gemini';
import { getFeeStructuresWithItems } from '@/lib/queries/fees';
import { getActiveFaqs } from '@/lib/queries/faq';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, schoolId } = await req.json();

  // Ground responses using verified database context
  const feeData = await getFeeStructuresWithItems(schoolId || 1);
  const faqData = await getActiveFaqs(schoolId || 1);

  const systemPrompt = `You are Kreativa Connect AI assistant for Sekolah Kreativa & SD Talenta Juara.
Answer parent inquiries politely in Indonesian. Strictly ground answers in verified fee and FAQ data.
FEE DATA: ${JSON.stringify(feeData)}
FAQ DATA: ${JSON.stringify(faqData)}`;

  const result = streamText({
    model: defaultGeminiModel,
    system: systemPrompt,
    messages,
    temperature: 0.2,
  });

  return result.toDataStreamResponse();
}
```

---

## 6. Testing & Quality Checkpoints

Before committing any changes:
1. **Type Checking**: Run `npm run type-check` (or `tsc --noEmit`). No `any` types for SQL results; always write explicit interfaces.
2. **Linting**: Ensure zero lint errors.
3. **Index Verification**: Cross-reference every raw SQL `WHERE`, `ORDER BY`, and `JOIN` clause against indexed columns in [`erd.md`](file:///e:/PKL/Kreativa/erd.md).
4. **Performance**: Keep Time-To-First-Byte (TTFB) < 200ms by leveraging Upstash Redis caching for frequently accessed data.
