# TRD — Kreativa Connect
**Technical Requirements Document & System Architecture**
Version 1.0 | October 2026
Target Environment: Next.js SSR • Vercel • Neon DB Serverless • Upstash Redis

---

## 1. Executive Summary & Architectural Philosophy

Kreativa Connect is an enterprise-grade parent communication CRM and live chat system designed for high concurrency, ultra-low latency, and robust multi-tenant scalability.

### Architectural Principles:
1. **Server-Side Rendered (SSR) & SEO-First**: Strictly **NOT a Single Page Application (SPA)**. Built with Next.js App Router utilizing React Server Components (RSC) and dynamic Server-Side Rendering (SSR) for instantaneous First Contentful Paint (FCP) and optimal search visibility.
2. **Serverless Infrastructure**: Fully hosted on **Vercel** with edge routing, serverless API execution, and zero cold-start database scaling.
3. **Pure Raw SQL Execution**: **Drizzle is restricted exclusively to schema migration and idempotent database seeding**. Zero ORM abstractions are permitted at runtime. All application queries are executed via parameterized Raw SQL using Neon serverless connection pooling to guarantee maximal execution velocity and index utilization.
4. **Clean Decoupled Data Access Layer**: Raw SQL queries are strictly forbidden inside React components. All database access is encapsulated inside dedicated repositories (`lib/queries/{model}.ts`) and consumed by REST API routes (`app/api/{model}/route.ts`) and Server Components.
5. **Distributed Caching & High Traffic Resiliency**: **Upstash Redis** provides distributed caching, rate-limiting, and session state management to sustain high concurrency spikes without saturating database connection pools.
6. **Object & Media Storage**: All files, transfer receipts, brochures, and contact attachments are stored on **Vercel Blob Storage** with signed upload URLs and global CDN delivery.

---

## 2. Technology Stack & Core Dependencies

### 2.1 Core Framework & Runtime
| Component | Technology | Version / Spec | Justification |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `14.2+` / `15.x` | Hybrid RSC + SSR, streaming HTML, nested layouts, optimal SEO |
| **Language** | TypeScript | `^5.4` | Strict type safety across SQL query return types and component props |
| **Hosting & Deployment**| Vercel | Production Edge | Serverless function execution, automatic HTTPS, global CDN edge |
| **Styling** | Vanilla CSS / CSS Modules | Standard CSS3 | Zero runtime overhead, clean tokens, fast rendering |

### 2.2 Database, Migration & Caching Layer
| Component | Technology | Package | Purpose |
|---|---|---|---|
| **Primary Database** | Neon DB (PostgreSQL Serverless) | `@neondatabase/serverless` | Serverless connection pooling, WebSocket/HTTP drivers |
| **Migration & Seed Only** | Drizzle Kit | `drizzle-orm`, `drizzle-kit` | **Migrations and idempotent seeds ONLY**. Not used as runtime ORM. |
| **Distributed Cache** | Upstash Redis | `@upstash/redis` | Multi-tenant session store, response caching, rate limiting |
| **Rate Limiting** | Upstash Rate Limit | `@upstash/ratelimit` | Token bucket / Sliding window rate limiting on public widget APIs |

### 2.3 Specialized Libraries & Dependencies
| Domain | Package | Specific Usage |
|---|---|---|
| **Conversational AI (Free Tier)** | `ai` (Vercel AI SDK), `@ai-sdk/google` | Direct **Google Gemini API** (`gemini-1.5-flash` via Google AI Studio Free Tier — 1,500 RPD gratis) for streaming answers and fee queries |
| **Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Admission pipeline Kanban board drag-and-drop stage updates |
| **Analytics & Charts** | `recharts` | Real-time SLA compliance, lead funnel velocity, agent workload |
| **Rich Text Editor** | `@tiptap/react`, `@tiptap/starter-kit` | Knowledge base article editor, canned response template composer |
| **PDF Generation** | `@react-pdf/renderer` & `pdf-lib` | Student confirmation letters, fee quotes, official brochure exports |
| **Spreadsheets / Export** | `xlsx` (`sheetjs`) | Admission records, CRM contacts, audit trail Excel/CSV reports |
| **Object Storage** | `@vercel/blob` | Receipt verification images, documents, downloadable brochures |
| **Validation** | `zod` | Strict validation of incoming API request bodies and route params |
| **Date & Time** | `date-fns` | SLA calculation, calendar schedules, localized relative time formatting |

---

## 3. System Architecture & Component Interaction

```
[ Client Browser / Public Widget ]
                │
                │ HTTPS (SSR Request / Fetch API / Streaming Chat)
                ▼
        [ Vercel Edge CDN ]
                │
                ├──► React Server Components (SSR Initial HTML)
                └──► API Route Handlers (/app/api/{model}/route.ts)
                           │
                           ├──► Rate Limiter & Cache Layer [ Upstash Redis ]
                           │          │ (Cache Hit: Return Cached Response)
                           │
                           ├──► Raw Query Repository Layer [ lib/queries/*.ts ]
                           │          │ (Parameterized Raw SQL)
                           │          ▼
                           │    [ Neon DB Serverless Pool ]
                           │          │
                           │          ├──► Master PostgreSQL Tables
                           │          └──► External DB Connections (Secondary .env pools)
                           │
                           ├──► Direct Google Gemini Layer [ @ai-sdk/google ]
                            │          │ (Google AI Studio Free Tier — 1,500 RPD)
                           │          ▼
                           │    [ Google Gemini 1.5 Flash ]
                           │          │ (RAG Context from Knowledge Base & Fee Tables)
                           │
                           └──► File Uploads & Documents
                                      │
                                      ▼
                                [ Vercel Blob Storage ]
```

---

## 4. Database Access Strategy: Raw SQL over Neon

### 4.1 Strict Raw SQL Policy
- **No ORM at Runtime**: Query builders (Prisma, TypeORM, Drizzle ORM query builders) are strictly prohibited from execution in application request lifecycles.
- **Drizzle Boundary**: Drizzle is utilized solely to compile SQL migration files (`drizzle/migrations/`) and execute idempotent data seeds via CLI (`npm run db:seed`).
- **Connection Client**: Queries are dispatched through the official Neon Serverless driver:
  ```typescript
  // lib/db/neon.ts
  import { neon, neonConfig } from '@neondatabase/serverless';

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // HTTP-based serverless pooler connection (ultra-fast for stateless serverless)
  export const sql = neon(process.env.DATABASE_URL);
  ```

### 4.2 Decoupled Query Repositories (`lib/queries/`)
Every domain model has its own query file containing strictly parameterized raw SQL functions. Zero SQL strings are allowed directly inside React components or inline inside general utility files.

**Directory Structure:**
```
lib/
├── db/
│   ├── neon.ts              # Primary Neon DB serverless client
│   └── external-dbs.ts      # Multi-database connection pools (from .env)
├── redis/
│   ├── client.ts            # Upstash Redis client
│   └── cache.ts             # Cache-aside helper (getOrSet)
├── blob/
│   └── storage.ts           # Vercel Blob upload / delete handlers
└── queries/
    ├── conversations.ts     # Raw queries for conversations & inbox
    ├── messages.ts          # Raw queries for chat messages & threads
    ├── contacts.ts          # Raw queries for contacts & parents
    ├── admission.ts         # Raw queries for Kanban pipeline & stages
    ├── chatbot.ts           # Raw queries for branching flow nodes & options
    ├── fees.ts              # Raw queries for fee_structures & fee_items
    ├── tasks.ts             # Raw queries for agent task management
    └── analytics.ts         # Raw queries for reporting & SLA calculation
```

#### Example Raw Query Repository (`lib/queries/fees.ts`):
```typescript
import { sql } from '@/lib/db/neon';

export interface FeeStructureRecord {
  id: number;
  school_id: number;
  campus: string;
  academic_year: string;
  edu_level: string;
  level_name: string;
  scheme_name: string;
  registration_fee: string;
  currency: string;
  inclusions: string | null;
  exclusions: string | null;
  notes: string | null;
  brochure_url: string | null;
  is_active: boolean;
}

export interface FeeItemRecord {
  id: number;
  fee_structure_id: number;
  grade_label: string;
  grade_order: number;
  item_name: string;
  fee_category: string;
  billing_period: string;
  period_label: string;
  amount: string;
  notes: string | null;
}

export async function getFeeStructuresBySchoolAndCampus(
  schoolId: number,
  campus?: string
): Promise<FeeStructureRecord[]> {
  if (campus) {
    const rows = await sql`
      SELECT id, school_id, campus, academic_year, edu_level, level_name,
             scheme_name, registration_fee, currency, inclusions, exclusions,
             notes, brochure_url, is_active
      FROM fee_structures
      WHERE school_id = ${schoolId}
        AND campus = ${campus}
        AND is_active = TRUE
      ORDER BY id ASC
    `;
    return rows as FeeStructureRecord[];
  }

  const rows = await sql`
    SELECT id, school_id, campus, academic_year, edu_level, level_name,
           scheme_name, registration_fee, currency, inclusions, exclusions,
           notes, brochure_url, is_active
    FROM fee_structures
    WHERE school_id = ${schoolId}
      AND is_active = TRUE
    ORDER BY campus ASC, id ASC
  `;
  return rows as FeeStructureRecord[];
}

export async function getFeeItemsByStructureId(
  feeStructureId: number
): Promise<FeeItemRecord[]> {
  const rows = await sql`
    SELECT id, fee_structure_id, grade_label, grade_order, item_name,
           fee_category, billing_period, period_label, amount, notes
    FROM fee_items
    WHERE fee_structure_id = ${feeStructureId}
    ORDER BY grade_order ASC, item_name ASC
  `;
  return rows as FeeItemRecord[];
}
```

---

## 5. API Route Architecture (`app/api/{model}/route.ts`)

Every model is exposed via modular REST endpoints adhering strictly to REST semantics:

| Model | Path | Methods | Description |
|---|---|---|---|
| **Conversations** | `/api/conversations` | `GET`, `POST` | List conversations with status/channel filters; Create conversation |
| **Conversation Detail** | `/api/conversations/[id]` | `GET`, `PATCH` | Fetch conversation metadata, update status or assignment |
| **Messages** | `/api/conversations/[id]/messages` | `GET`, `POST` | Paginated message thread retrieval; Send agent message |
| **Contacts** | `/api/contacts` | `GET`, `POST` | Search contacts with GIN FTS; Create prospective/active contact |
| **Admission Records** | `/api/admission` | `GET`, `POST`, `PATCH` | Kanban columns data, stage progression with log entry |
| **Tasks** | `/api/tasks` | `GET`, `POST`, `PATCH` | Overdue and active follow-up tasks |
| **Chatbot Nodes** | `/api/chatbot/nodes` | `GET`, `POST` | Chatbot state machine nodes and interactive branching options |
| **Chatbot Session** | `/api/chatbot/session` | `POST` | Start anonymous widget session, handle parent branch choices |
| **Fee Structures** | `/api/fees` | `GET` | Retrieve fee schedules by campus and education level |
| **File Uploads** | `/api/upload` | `POST` | Generate Vercel Blob signed upload URL or direct serverless upload |
| **Reports & Export** | `/api/reports/export` | `GET` | Stream Excel (.xlsx) or PDF exports |

#### Example Route Handler (`app/api/fees/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getFeeStructuresBySchoolAndCampus, getFeeItemsByStructureId } from '@/lib/queries/fees';
import { redisGetOrSet } from '@/lib/redis/cache';

export const runtime = 'nodejs'; // or 'edge'
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = parseInt(searchParams.get('school_id') || '1', 10);
    const campus = searchParams.get('campus') || undefined;
    const includeItems = searchParams.get('include_items') === 'true';

    const cacheKey = `fees:${schoolId}:${campus || 'all'}:${includeItems}`;

    // Cache via Upstash Redis for 30 minutes (1800s)
    const result = await redisGetOrSet(cacheKey, 1800, async () => {
      const structures = await getFeeStructuresBySchoolAndCampus(schoolId, campus);

      if (!includeItems) {
        return structures;
      }

      const structuresWithItems = await Promise.all(
        structures.map(async (st) => {
          const items = await getFeeItemsByStructureId(st.id);
          return { ...st, items };
        })
      );

      return structuresWithItems;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Failed to fetch fees:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

## 6. Distributed Caching & Rate Limiting: Upstash Redis

### 6.1 Redis Client Configuration
```typescript
// lib/redis/client.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### 6.2 Cache-Aside Helper (`lib/redis/cache.ts`)
```typescript
// lib/redis/cache.ts
import { redis } from './client';

export async function redisGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (err) {
    console.warn(`Redis read failed for ${key}, falling back to DB:`, err);
  }

  const fresh = await fetcher();

  try {
    await redis.set(key, fresh, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`Redis write failed for ${key}:`, err);
  }

  return fresh;
}

export async function redisInvalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`Redis invalidation failed for ${pattern}:`, err);
  }
}
```

### 6.3 Rate Limiting on Public Widget
```typescript
// lib/redis/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './client';

export const widgetRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute per IP
  analytics: true,
  prefix: 'ratelimit:widget',
});
```

---

## 7. Media & Object Storage: Vercel Blob

All binary files, parent transfer proof screenshots, student documents, and PDF brochures are processed through Vercel Blob storage (`@vercel/blob`).

### Storage Helper (`lib/blob/storage.ts`):
```typescript
import { put, del } from '@vercel/blob';

export async function uploadPublicFile(
  path: string,
  file: File | Buffer,
  contentType?: string
): Promise<{ url: string; size: number }> {
  const blob = await put(path, file, {
    access: 'public',
    contentType,
  });
  return { url: blob.url, size: blob.size };
}

export async function deletePublicFile(url: string): Promise<void> {
  await del(url);
}
```

---

## 8. Conversational AI Engine: Direct Google Gemini API (Free Tier)

The AI assistant handles automated parent inquiries, fee calculations, admissions guidelines, and FAQ explanations using **Google Gemini** directly via Google AI Studio Free Tier (100% gratis, tanpa biaya gateway).

### 8.1 Google Gemini Client Setup (`lib/ai/gemini.ts`)
```typescript
import { google } from '@ai-sdk/google';

// Direct connection to Google Gemini API (Free Tier: 15 RPM, 1,500 RPD)
export const defaultGeminiModel = google(
  process.env.AI_MODEL_DEFAULT || 'gemini-1.5-flash'
);
```

### 8.2 Streaming Chat Route Handler (`app/api/ai/chat/route.ts`)
```typescript
import { streamText } from 'ai';
import { defaultGeminiModel } from '@/lib/ai/gemini';
import { getFeeStructuresWithItems } from '@/lib/queries/fees';
import { getActiveFaqs } from '@/lib/queries/faq';
import { checkRateLimit } from '@/lib/redis/ratelimit';

export const runtime = 'edge';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await checkRateLimit(`ai:${ip}`, 20, '1m');
  if (!success) {
    return new Response(JSON.stringify({ error: 'Too many AI requests. Please try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, schoolId } = await req.json();

  // Grounding Context: Retrieve active fee structure and school FAQs via raw SQL
  const feeData = await getFeeStructuresWithItems(schoolId || 1);
  const faqData = await getActiveFaqs(schoolId || 1);

  const systemPrompt = `You are Kreativa Connect AI, the official virtual assistant for Sekolah Kreativa & SD Talenta Juara.
Answer parent inquiries politely, clearly, and accurately in Indonesian.
Always ground your answers in the following verified school fees and FAQ data. If information is not listed, direct the parent to speak with an admissions officer.

=== VERIFIED FEE DATA ===
${JSON.stringify(feeData, null, 2)}

=== VERIFIED FAQ DATA ===
${JSON.stringify(faqData, null, 2)}
`;

  const result = streamText({
    model: defaultGeminiModel,
    system: systemPrompt,
    messages,
    temperature: 0.2, // Low temperature for factual precision
  });

  return result.toDataStreamResponse();
}
```

---

## 9. Frontend Architecture & Reusable Component System

### 9.1 SSR Next.js Layout Structure
```
app/
├── (admin)/
│   ├── layout.tsx              # Admin shell (Sidebar, Top Navigation, User Context)
│   ├── dashboard/page.tsx      # SSR Dashboard with KPI cards & feeds
│   ├── inbox/page.tsx          # Real-time unified Inbox
│   ├── pipeline/page.tsx       # Kanban Admission Board (dnd-kit)
│   ├── contacts/page.tsx       # Parent contact management (FTS search)
│   ├── fees/page.tsx           # Multi-campus fee manager & preview
│   ├── knowledge/page.tsx      # Tiptap knowledge base editor
│   ├── analytics/page.tsx      # Recharts SLA & performance reports
│   └── settings/page.tsx       # System parameters & AI provider config
├── (widget)/
│   └── chat-widget/page.tsx    # Standalone embeddable Parent Live Chat
└── api/                        # REST API routing layer
```

### 9.2 Component Modules & Library Integrations

#### 1. Admission Kanban Board (`@dnd-kit`)
- Component: `components/pipeline/KanbanBoard.tsx`
- Features: 4 distinct columns (`Inquiring`, `Selection`, `Accepted`, `Enrolled`).
- Drag-and-drop smooth sensors (`PointerSensor`, `TouchSensor`).
- On drop: Instant optimistic UI update followed by asynchronous `PATCH /api/admission/{id}` dispatching raw SQL log insertion in `admission_logs`.

#### 2. Analytics Dashboard Charts (`recharts`)
- Component: `components/analytics/SlaChart.tsx`, `FunnelChart.tsx`
- Features: Responsive container, SVG animations, multi-level color palettes, daily SLA compliance tracking, average response time comparison.

#### 3. Knowledge Base & Template Editor (`@tiptap/react`)
- Component: `components/knowledge/RichTextEditor.tsx`
- Features: StarterKit extensions, bold, italic, headings, bullet lists, ordered lists, link inserter, clear formatting, auto-saving draft state.

#### 4. Excel & PDF Exporters (`xlsx` & `@react-pdf/renderer`)
- Components: `components/common/ExcelExportButton.tsx`, `lib/pdf/FeeBrochureDocument.tsx`
- Features:
  - Excel: Client-side and server-side worksheet generation with formatted column widths and header styles.
  - PDF: Pixel-perfect branded school fee breakdowns and parent acceptance letters.

---

## 10. Multi-Database Secondary Connections (.env Architecture)

To satisfy dynamic synchronization with existing school CMS portals (`talentajuara.sch.id` and `kreativaglobal.sch.id`), the system supports multiple database connection pools managed through environment variables:

```typescript
// lib/db/external-dbs.ts
import { Pool as PgPool } from 'pg';

let talentaPool: PgPool | null = null;
let kreativaWebPool: PgPool | null = null;

export function getTalentaDbPool(): PgPool | null {
  if (!process.env.TALENTA_DB_URL) return null;
  if (!talentaPool) {
    talentaPool = new PgPool({
      connectionString: process.env.TALENTA_DB_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return talentaPool;
}

export function getKreativaWebDbPool(): PgPool | null {
  if (!process.env.KREATIVA_WEB_DB_URL) return null;
  if (!kreativaWebPool) {
    kreativaWebPool = new PgPool({
      connectionString: process.env.KREATIVA_WEB_DB_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return kreativaWebPool;
}
```

---

## 11. High-Traffic Optimization & Production Hardening

| Dimension | Strategy | Implementation |
|---|---|---|
| **Database Pooling** | Serverless HTTP queries | `@neondatabase/serverless` eliminates connection exhaustion issues on serverless lambdas. |
| **Edge Caching** | Upstash Redis Cache-Aside | All read-heavy endpoints (Fees, FAQs, Settings, Chatbot Root) cached with TTL and stale-while-revalidate invalidation. |
| **Rate Limiting** | Sliding Window Algorithm | Upstash Rate Limit safeguards public chat widget against spam and DoS attempts. |
| **Bundle Optimization** | Dynamic Imports & Code Splitting | Tiptap, Recharts, and DnD-Kit are loaded via `next/dynamic` with SSR disabled where appropriate to reduce initial bundle footprint under 90KB. |
| **Image Delivery** | Next.js `<Image>` + Vercel Edge | WebP/AVIF auto-transcoding, lazy loading, and responsive srcset. |
| **Database Indexes** | Partial, Composite, & GIN | Explicit indexes for `is_active = TRUE`, `is_done = FALSE`, and PostgreSQL `tsvector` FTS lookups. |

---

## 12. Environment Variable Specification (`.env.example`)

```env
# Server Runtime
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://connect.kreativaglobal.sch.id

# Primary Neon Database Serverless (PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:secret@ep-cool-frost-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# External School Databases (Optional Secondary Dynamic Connections)
TALENTA_DB_URL=postgresql://readonly_user:secret@db.talentajuara.sch.id:5432/talenta_web?sslmode=require
KREATIVA_WEB_DB_URL=postgresql://readonly_user:secret@db.kreativaglobal.sch.id:5432/kreativa_web?sslmode=require

# Upstash Redis (Caching & Rate Limiting)
UPSTASH_REDIS_REST_URL=https://upstash-cluster-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxSecretToken

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxx

# Google Gemini API (Free Tier via Google AI Studio)
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_MODEL_DEFAULT=gemini-1.5-flash
```
