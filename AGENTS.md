# AGENTS.md — Kreativa Connect AI Agent Instructions & Protocols

This document establishes the mandatory behavioral guidelines, execution workflows, and architectural boundaries for autonomous AI agents and subagents working within the **Kreativa Connect** codebase.

---

## 1. Project Context & Mission

**Kreativa Connect** is a multi-tenant parent communication CRM and live chat system designed for Kreativa Global School and partner institutions (including Sekolah Talenta Juara). It unifies WhatsApp channels, provides an admission Kanban pipeline, features a branching chatbot with AI fallback, and manages multi-campus school fees.

### Master Specification Documents:
- **Product Requirements**: [`prd.md`](file:///e:/PKL/Kreativa/prd.md)
- **Database Architecture & Seed**: [`erd.md`](file:///e:/PKL/Kreativa/erd.md)
- **Technical Architecture**: [`trd.md`](file:///e:/PKL/Kreativa/trd.md)
- **Developer Guidelines**: [`claude.md`](file:///e:/PKL/Kreativa/claude.md)

---

## 2. Inviolable Agent Guardrails (DOs and DON'Ts)

| Category | Strict Rule | Rationale |
|---|---|---|
| ❌ **NO SPA** | Never create an SPA (Vite/CRA or CSR single page). | Must use **Next.js App Router with SSR** for maximum loading speed and SEO. |
| ❌ **NO RUNTIME ORM** | Never use Drizzle, Prisma, or TypeORM query builders in app code. | Drizzle is **strictly for migrations and idempotent seeds**. All app queries are pure raw SQL via Neon. |
| ❌ **NO INLINE SQL** | Never write raw SQL directly inside React components or inline inside route handlers. | All SQL must live in dedicated files under `lib/queries/{model}.ts`. |
| ❌ **NO UNPARAMETERIZED SQL** | Never concatenate strings in SQL (`sql + "WHERE id = " + id`). | Always use tagged template literals (`sql\`... WHERE id = ${id}\``) to prevent SQL injection. |
| ❌ **NO LOCAL STORAGE FILES** | Never save uploaded images/documents to local disk (`/public/uploads`). | All files must be saved to **Vercel Blob Storage** (`@vercel/blob`). |
| ❌ **NO PAID AI GATEWAYS** | Never configure paid gateways or unnecessary proxy tokens. | Connect **Google Gemini** (`gemini-1.5-flash`) directly via `@ai-sdk/google` (100% Free Tier via Google AI Studio — 1,500 RPD). |
| ✅ **MANDATORY REDIS CACHING** | Always wrap read-heavy queries in Upstash Redis cache-aside. | Safeguards database serverless connection limits under high traffic. |
| ✅ **MANDATORY TYPE SAFETY** | Always declare TypeScript interfaces for query results and component props. | Zero usage of `any` for database models. |

---

## 3. Step-by-Step Feature Implementation Protocol

When instructed to add or modify any capability, execute following this exact chain:

```
[1. Database Migration]
        │ Update drizzle/schema.ts -> Generate migration -> Update seed.ts
        ▼
[2. Data Access Layer]
        │ Write parameterized Raw SQL in lib/queries/{model}.ts with strict types
        ▼
[3. REST API Handler]
        │ Create app/api/{model}/route.ts -> Zod validation -> Upstash Redis cache
        ▼
[4. Reusable UI Components]
        │ Create components in components/{module}/ -> RSC for SSR -> Isolate client boundary
        ▼
[5. Documentation & Verification]
        │ Update erd.md / prd.md / trd.md if schema or endpoints changed
```

### Protocol A: Adding or Modifying a Database Model
1. Check existing tables in [`erd.md`](file:///e:/PKL/Kreativa/erd.md) for foreign keys and indexes.
2. In Drizzle schema (`drizzle/schema.ts`), define the table using:
   - `bigserial('id').primaryKey()` (NO UUIDs).
   - `varchar('...', { length: 50 })` with explicit CHECK constraints (NO ENUMs).
   - Multi-tenant `school_id` foreign key.
   - High-traffic indexes (`composite`, `partial`, or `GIN`).
3. Create raw query functions in `lib/queries/{model}.ts` using `sql` from `@/lib/db/neon`.
4. Create the API endpoint in `app/api/{model}/route.ts`.

### Protocol B: Handling Media & Document Uploads
1. Install and use `@vercel/blob`.
2. Implement file upload via serverless API `app/api/upload/route.ts` or signed client upload.
3. Save the returned Vercel Blob public URL in the respective database column.
4. If a file is deleted or replaced, invoke `del(url)` from `@vercel/blob`.

### Protocol C: Interactive Components (Kanban, Charts, Editor, Exporters)
- **Kanban Board**: Use `@dnd-kit/core` and `@dnd-kit/sortable`. Implement optimistic drag states and synchronize via `PATCH /api/admission/{id}`.
- **Analytics Charts**: Use `recharts`. Encapsulate in client components loaded via dynamic import (`ssr: false`) if window measurements are required.
- **Rich Text Editor**: Use `@tiptap/react` and `@tiptap/starter-kit`. Persist sanitized HTML or JSON to knowledge base records.
- **Excel Export**: Use `xlsx` (`sheetjs`) to convert JSON query output directly into `.xlsx` binary buffers.
- **PDF Generation**: Use `@react-pdf/renderer` to compile branded admission confirmation letters and fee brochures.

### Protocol D: Conversational AI with Google Gemini (Free Tier)
1. Use `@ai-sdk/google` together with Vercel AI SDK (`ai`).
2. Client configuration in `lib/ai/gemini.ts` connects directly via `google(process.env.AI_MODEL_DEFAULT || 'gemini-1.5-flash')` without intermediate gateway proxies.
3. Default model: `gemini-1.5-flash` (Google AI Studio Free Tier: 15 RPM, 1,500 RPD, 1M TPM).
4. Streaming response: Always stream tokens via `streamText()` in `app/api/ai/chat/route.ts` with `export const runtime = 'edge'`.
5. Factual Grounding: Never allow AI hallucinations regarding school fees or registration dates. Inject live database context from `lib/queries/fees.ts` (`getFeeStructuresWithItems`) and `lib/queries/faq.ts` (`getActiveFaqs`) into system prompts.
6. Rate Limiting: Safeguard AI endpoints using Upstash sliding window rate limiting (`checkRateLimit('ai:${ip}', 20, '1m')`).

---

## 4. Multi-Database Connection Guidelines

Kreativa Connect dynamically pulls data from connected school websites (`talentajuara.sch.id` and `kreativaglobal.sch.id`).

Agents must observe:
1. All secondary database URLs are configured in `.env` (`TALENTA_DB_URL`, `KREATIVA_WEB_DB_URL`).
2. Secondary connections are instantiated as connection pools in `lib/db/external-dbs.ts`.
3. Never perform write (`INSERT`, `UPDATE`, `DELETE`) operations on external school databases; use **READ-ONLY** queries.
4. Wrap external database queries with Upstash Redis caching (`redisGetOrSet`) with a TTL of 1800s (30 minutes) to avoid network latency.

---

## 5. Agent Verification Checklist

Before reporting completion to the user, the agent must verify:
- [ ] **No SPA architecture**: Application uses Next.js App Router SSR.
- [ ] **No ORM query builder**: Zero calls to `db.select()`, `db.insert()` at runtime.
- [ ] **Decoupled queries**: All SQL queries reside in `lib/queries/` and not inside components or inline in API routes.
- [ ] **Neon serverless compatibility**: Uses `sql` from `@neondatabase/serverless` with parameterization.
- [ ] **Upstash caching**: High-traffic read endpoints are wrapped with Redis cache.
- [ ] **Vercel Blob**: File upload logic uses `@vercel/blob`.
- [ ] **Direct Google Gemini (Free Tier)**: AI streaming routes connect directly to Google Gemini via `@ai-sdk/google` (100% gratis) with factual fee and FAQ grounding.
- [ ] **Documentation integrity**: All modified files and code symbols are formatted with clickable `file:///` links.
