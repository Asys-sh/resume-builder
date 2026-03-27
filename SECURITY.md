# Security Reference — Landed

> This document is the single source of truth for security patterns in this codebase.
> Every API route, data mutation, and user-facing input **must** follow these patterns.
> AI agents and developers should consult this before writing any new endpoint or component.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Input Sanitization](#2-input-sanitization)
3. [Input Validation (Zod)](#3-input-validation-zod)
4. [Ownership Enforcement (Prisma)](#4-ownership-enforcement-prisma)
5. [Rate Limiting](#5-rate-limiting)
6. [Data Minimization](#6-data-minimization)
7. [Error Handling](#7-error-handling)
8. [File Upload Security](#8-file-upload-security)
9. [Webhook Verification](#9-webhook-verification)
10. [Password & Credential Security](#10-password--credential-security)
11. [Environment Variables](#11-environment-variables)
12. [Common Pitfalls & Anti-Patterns](#12-common-pitfalls--anti-patterns)
13. [Checklist for New Endpoints](#13-checklist-for-new-endpoints)

---

## 1. Authentication

### How it works

- **Strategy:** JWT stored in an HTTP-only, SameSite=Lax, Secure cookie (`authjs.session-token`)
- **Library:** NextAuth v5 (Auth.js) with Credentials + Google OAuth providers
- **Helper:** `getServerUser()` from `@/lib/auth-helper`

### The standard auth guard

Every protected API route **must** start with:

```ts
import { getServerUser } from '@/lib/auth-helper'

const user = await getServerUser()
if (!user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

`getServerUser()` returns `{ id: string } | null`. It never throws — a `null` return means the user is not authenticated. Do not catch errors around it.

### What `getServerUser()` does internally

1. Reads the `authjs.session-token` cookie
2. Decodes the JWT using `AUTH_SECRET` as the key and the cookie name as salt
3. Extracts `token.sub` (the user's database ID)
4. Returns `{ id: token.sub }` or `null` on any failure

### There is no global middleware

Auth is enforced per-route, not via `middleware.ts`. This means **every new route must add its own auth check** — there is no safety net.

### Public routes (no auth required)

- `POST /api/auth/signup`
- `GET /api/auth/verify-email`
- `POST /api/auth/password-reset-request`
- `POST /api/auth/password-reset-confirm`
- `GET/POST /api/auth/[...nextauth]`
- `POST /api/webhooks/stripe` (verified by Stripe signature instead)
- `GET /r/[slug]` (public resume page)

Everything else requires authentication.

---

## 2. Input Sanitization

### Functions (from `@/lib/sanitize`)

| Function | What it strips | Use for |
|----------|---------------|---------|
| `sanitizeText(value)` | HTML tags (`<...>`), `javascript:`, `data:` schemes | All text fields (names, titles, descriptions, notes) |
| `sanitizeUrl(value)` | `javascript:`, `data:`, `vbscript:` schemes (returns `''` if dangerous) | URL fields (links, project URLs, job URLs) |
| `sanitizeResumeData(data)` | Recursively sanitizes all text + URL fields in a `ResumeData` object | Full resume saves |
| `sanitizePresetData(data)` | Sanitizes all fields in a profile preset | Preset creates/updates |

### When to sanitize

**Always sanitize before writing to the database.** Not after reading, not in the client — at the API boundary, right before `prisma.create` or `prisma.update`.

```ts
// CORRECT — sanitize at the API boundary
const data = sanitizeResumeData(body.data as unknown as ResumeData)
await prisma.resume.update({ where: { id, userId: user.id }, data: { ... } })

// WRONG — sanitizing only on the client (can be bypassed)
// WRONG — sanitizing after reading from DB (damage already done)
```

### Text fields

```ts
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

const company = sanitizeText(body.company)
const jobUrl = sanitizeUrl(body.jobUrl) || null
```

### URL fields — extra caution

Zod's `.url()` validator does **not** block `javascript:` URIs in all runtimes. Always apply `sanitizeUrl()` to any value that will be rendered in an `href` attribute:

```ts
// In the API route:
jobUrl: sanitizeUrl(body.jobUrl) || null

// In React — safe because sanitizeUrl already ran:
<a href={app.jobUrl}>Link</a>
```

### What the regex does

- `/<[^>]*>/g` — strips HTML tags (basic XSS prevention)
- `/javascript\s*:/gi` — strips javascript: URIs (case-insensitive, with optional whitespace)
- `/data\s*:/gi` — strips data: URIs
- `/^(javascript|data|vbscript)\s*:/i` — sanitizeUrl test (rejects entire URL if scheme is dangerous)

### Known limitations

- The HTML regex `/<[^>]*>/g` can be bypassed with malformed tags (e.g., `<img src=x onerror=alert(1)//` without closing `>`). This is mitigated because React's JSX auto-escapes all text content — the sanitizer is a defense-in-depth layer.
- **Never use `dangerouslySetInnerHTML`** with user-supplied content.

---

## 3. Input Validation (Zod)

### The `parseBody` helper

```ts
import { parseBody } from '@/lib/schemas'

const { data: body, error } = await parseBody(req, MySchema)
if (error) return error  // Returns 400 with validation details
```

`parseBody` handles JSON parsing, Zod validation, and error formatting in one call. On failure, it returns a `NextResponse` with status **400** (not 422).

### Error response format

```json
{
  "error": "Validation error: company: Required, role: String must contain at least 1 character"
}
```

Field paths and constraint messages are included — these are safe to expose (no internal details).

### Existing schemas (in `@/lib/schemas`)

| Schema | Used by | Key constraints |
|--------|---------|----------------|
| `ResumeBodySchema` | Resume create/update | title: max 200, summary: max 5000 |
| `ContactInfoSchema` | Nested in resume | photo: optional URL |
| `CoverLetterCreateSchema` | Cover letter create | content: max 50000, jobDescription: max 10000 |
| `AIAssistSchema` | AI assist | type: enum, skills: array preprocessor |
| `AICoverLetterSchema` | AI cover letter | jobDescription: min 1, max 10000 |
| `ProfilePresetCreateSchema` | Preset create | label: min 1 max 100, links: max 10 items |
| `UserUpdateSchema` | Profile update | email: `.email()` validated |
| `CheckoutSchema` | Stripe checkout | priceId: min 1, quantity: positive int |

### Query parameter validation

For enumerated query params, use `z.enum()` — never parse arbitrary numbers:

```ts
// CORRECT — strict enum
const schema = z.enum(['30', '60', '90']).default('30')
const result = schema.safeParse(req.nextUrl.searchParams.get('days') ?? undefined)
if (!result.success) {
  return NextResponse.json({ error: 'Invalid range. Allowed values: 30, 60, 90' }, { status: 400 })
}

// WRONG — allows any number
const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30')
```

---

## 4. Ownership Enforcement (Prisma)

### The compound WHERE pattern

**Every query that accesses user-specific data must include `userId` in the WHERE clause:**

```ts
// CORRECT — ownership enforced at the database level
const resume = await prisma.resume.findUnique({
  where: { id: resumeId, userId: user.id },
})
if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

// WRONG — fetches by ID only, then checks ownership in JS
const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
if (resume.userId !== user.id) return 403  // Race condition window + code smell
```

The compound WHERE pattern is preferred because:
1. It's atomic — no TOCTOU race condition
2. It returns `null` for both "not found" and "wrong owner" (no user enumeration)
3. It's one query instead of two

### The ownership helper pattern

For routes that need to distinguish 404 from 403:

```ts
async function getOwnedResource(resourceId: string, userId: string) {
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
  if (!resource) return { resource: null, error: res404('Not found') }
  if (resource.userId !== userId) return { resource: null, error: res403('Forbidden') }
  return { resource, error: null }
}
```

Use this when the route needs to give different error messages for "doesn't exist" vs "belongs to someone else".

### Foreign key ownership (IDOR prevention)

When a user provides a foreign key (e.g., `resumeId` on a job application), **verify the referenced resource belongs to them**:

```ts
// CORRECT — verify ownership of the referenced resume
if (body.resumeId) {
  const resume = await prisma.resume.findUnique({
    where: { id: body.resumeId, userId: user.id },
  })
  if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
}

// WRONG — trusts the client-provided ID without checking ownership
await prisma.jobApplication.create({
  data: { resumeId: body.resumeId, userId: user.id }  // resumeId could be anyone's!
})
```

This prevents IDOR attacks where user A links their job application to user B's resume, leaking the resume title through the API response.

---

## 5. Rate Limiting

### How it works

`src/lib/rate-limit.ts` implements an in-memory sliding window with auto-cleanup of expired entries.

### Usage

```ts
import { checkRateLimit } from '@/lib/rate-limit'

// Returns a 429 Response if limit exceeded, or null if OK
const limited = checkRateLimit(`operation:${user.id}`, limit, windowMs)
if (limited) return limited
```

### Identifier convention

```
<operation>:<user-id-or-ip>
```

Examples: `ai-assist:cm1abc123`, `user-update:cm1abc123`, `checkout:cm1abc123`

### Current rate limits

| Route | Identifier | Limit | Window |
|-------|-----------|-------|--------|
| `POST /api/ai/assist` | `ai-assist:{userId}` | 20 | 1 hour |
| `POST /api/ai/cover-letter` | `ai-cover-letter:{userId}` | 20 | 1 hour |
| `POST /api/user/update` | `user-update:{userId}` | 10 | 1 hour |
| `DELETE /api/user/delete` | `user-delete:{userId}` | 3 | 1 hour |
| `POST /api/checkout` | `checkout:{userId}` | 10 | 1 hour |

### When to add rate limiting

Add rate limiting to any endpoint that:
- Creates database rows (prevents storage exhaustion)
- Calls external APIs (prevents cost runaway)
- Performs expensive operations (prevents CPU exhaustion)

### Limitations

- In-memory store is **not shared across serverless instances** — each cold start gets a fresh map
- For production at scale, replace with Redis-backed rate limiting
- The current implementation is sufficient for single-instance or low-traffic deployments

---

## 6. Data Minimization

### `select` vs `include`

**Use `select` when returning data to the client.** This creates an allowlist of fields — new sensitive fields added to the schema won't auto-leak.

```ts
// CORRECT — explicit allowlist
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    // stripeCustomerId: deliberately excluded
    // password: deliberately excluded
  },
})

// RISKY — returns all scalar fields, including any added in the future
const user = await prisma.user.findUnique({
  where: { id },
  include: { resumes: true },
})
```

**Use `include` when you need related data for server-side processing** (e.g., duplicating a resume with all relations). But never return the raw `include` result to the client without stripping internal fields.

### Snapshot data (JSON blobs)

When storing a data snapshot as JSON, **build a clean object with only the fields needed**:

```ts
// CORRECT — allowlisted fields
const snapshotData = {
  title: resume.title,
  summary: resume.summary,
  experiences: resume.experiences.map(({ company, role, startDate, endDate, description, location }) =>
    ({ company, role, startDate, endDate, description, location })
  ),
}

// WRONG — stores entire Prisma result including userId, viewCount, publicSlug...
const snapshotData = resume  // Leaks internal fields
```

### Restoring from JSON blobs

When restoring data from a JSON blob, **never spread unknown fields into a database write**:

```ts
// CORRECT — explicit allowlist per relation
tx.experience.createMany({
  data: snap.experiences.map((e: any) => ({
    resumeId: id,
    company: e.company ?? '',
    role: e.role ?? '',
    startDate: e.startDate ? new Date(e.startDate) : new Date(),
    endDate: e.endDate ? new Date(e.endDate) : null,
    description: e.description ?? null,
    location: e.location ?? null,
  })),
})

// WRONG — mass assignment, any field in the JSON blob gets written to DB
tx.experience.createMany({
  data: snap.experiences.map(({ id: _id, ...rest }) => ({
    ...rest,  // Could contain createdAt, updatedAt, resumeId pointing elsewhere, etc.
    resumeId: id,
  })),
})
```

---

## 7. Error Handling

### Standard pattern

```ts
export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ... business logic ...

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Descriptive context:', error)  // Full details to server logs
    return NextResponse.json(
      { error: 'Internal server error' },          // Generic message to client
      { status: 500 }
    )
  }
}
```

### Rules

1. **Never expose error details to the client.** Always return `{ error: 'Internal server error' }` for 500s.
2. **Always log the full error server-side** with a descriptive prefix (e.g., `'Error saving resume:'`).
3. **Never swallow errors silently.** If using `.catch()`, at minimum log:
   ```ts
   .catch((err) => console.error('[context]', err))
   ```
4. **Use appropriate status codes:**
   - `400` — Bad request (validation failure, malformed input)
   - `401` — Unauthorized (no auth token or invalid)
   - `403` — Forbidden (authenticated but not the owner)
   - `404` — Not found (resource doesn't exist or user doesn't own it)
   - `409` — Conflict (duplicate email, slug collision)
   - `429` — Rate limited
   - `500` — Unexpected server error
   - `503` — Service unavailable (third-party misconfigured)

### Fire-and-forget operations

For non-blocking side effects (e.g., view recording), always log errors:

```ts
// CORRECT
prisma.$transaction([...]).catch((err) => console.error('[view-recording]', err))

// WRONG — completely silent failure, impossible to debug
prisma.$transaction([...]).catch(() => {})
```

---

## 8. File Upload Security

### Architecture

Client uploads directly to Cloudinary. The server only provides a signed permission slip.

```
Client                    Server                    Cloudinary
  │                         │                          │
  ├─POST /api/upload/sign──►│                          │
  │                         ├─ verify auth             │
  │                         ├─ compute HMAC signature  │
  │◄─{ signature, params }──┤                          │
  │                         │                          │
  ├─POST cloudinary/upload─────────────────────────────►│
  │  (with signature)       │                          ├─ verify signature
  │◄─{ secure_url }────────────────────────────────────┤
```

### Server-side signing (`/api/upload/sign`)

- **Folder isolation:** `folder = user.id` — each user uploads to their own folder
- **No client input:** The route accepts no body — folder is always derived from the session
- **Algorithm:** SHA-256 with `signature_algorithm: 'sha256'` in signed params
- **Secret never exposed:** Only `signature`, `timestamp`, `apiKey`, `cloudName`, `folder` are returned

### Client-side validation (defense-in-depth)

`PhotoUpload.tsx` validates `image/*` type and 5MB size on the client. These checks are **easily bypassed** — they exist for UX, not security. For true enforcement, configure a Cloudinary **upload preset** with `allowed_formats` and `max_file_size`.

---

## 9. Webhook Verification

### Stripe webhooks (`/api/webhooks/stripe`)

```ts
// 1. Read raw body (not parsed JSON)
const body = await request.text()

// 2. Extract Stripe signature header
const signature = request.headers.get('stripe-signature')

// 3. Verify signature + timestamp
const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
```

`constructEvent` verifies:
- HMAC-SHA256 signature matches
- Timestamp is within tolerance (prevents replay attacks)
- Body integrity (prevents tampering)

### Idempotency

Stripe delivers webhooks at-least-once. The `ProcessedWebhook` table (keyed by `event.id`) prevents double-processing:

```ts
try {
  await prisma.processedWebhook.create({ data: { id: event.id } })
} catch {
  return NextResponse.json({ received: true })  // Already processed
}
```

---

## 10. Password & Credential Security

### Hashing

- **Algorithm:** Argon2id via `@node-rs/argon2` (memory-hard, GPU-resistant)
- **Usage:** `hash(password)` to create, `verify(storedHash, password)` to check
- **No salting needed:** Argon2 generates a random salt internally

### Password requirements (signup)

- Minimum 8 characters
- At least one uppercase letter (`/[A-Z]/`)
- At least one lowercase letter (`/[a-z]/`)
- At least one digit (`/[0-9]/`)
- At least one special character (`/[^A-Za-z0-9]/`)

### Password change flow

1. User must provide `currentPassword`
2. Server verifies it against stored hash via `verify()`
3. New password is hashed with `hash()`
4. Old hash is overwritten

### Email change flow

1. New email validated with Zod `.email()`
2. `emailVerified` set to `null` (revokes verification)
3. Verification email sent to new address
4. User must re-verify before new email is active

---

## 11. Environment Variables

All env vars are validated at module load time via Zod (`src/lib/env.ts`). The app crashes immediately on startup if any required variable is missing or malformed.

### Key validation rules

| Variable | Rule | Why |
|----------|------|-----|
| `AUTH_SECRET` | Min 32 chars | JWT signing key must have sufficient entropy |
| `STRIPE_SECRET_KEY` | Starts with `sk_` | Prevents accidentally using publishable key |
| `STRIPE_WEBHOOK_SECRET` | Starts with `whsec_` | Ensures correct webhook secret format |
| `RESEND_API_KEY` | Starts with `re_` | Validates API key format |
| `OPENAI_API_KEY` | Starts with `sk-` | Validates API key format |
| `DATABASE_URL` | Valid URL | Ensures parseable connection string |

### Optional variables

Google OAuth (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) and Cloudinary (`CLOUDINARY_*`) are optional — the app runs without them but those features are disabled.

---

## 12. Common Pitfalls & Anti-Patterns

### DO NOT

| Anti-Pattern | Why | Do Instead |
|-------------|-----|------------|
| `prisma.resume.findUnique({ where: { id } })` then check `userId` in JS | TOCTOU race + two-step pattern | `where: { id, userId: user.id }` |
| `{ ...rest, resumeId }` from untrusted JSON | Mass assignment — unknown fields written to DB | Explicit allowlist of fields |
| `const days = parseInt(params.get('days'))` | Accepts any number, including `999999` | `z.enum(['30', '60', '90'])` |
| `.catch(() => {})` on fire-and-forget operations | Silent failures, impossible to debug | `.catch(err => console.error(...))` |
| `dangerouslySetInnerHTML` with user content | XSS — React's auto-escaping is bypassed | Always use JSX text interpolation `{value}` |
| Returning raw Prisma objects to the client | May include `password`, `stripeCustomerId`, internal fields | Use `select` to build an allowlist |
| Trusting client-provided foreign keys | IDOR — user can reference another user's resources | Verify ownership of referenced resources |
| Client-side-only file validation | Trivially bypassed with cURL or dev tools | Enforce via Cloudinary upload presets or server-side checks |
| `include: { password: true }` in any query | Hashed passwords should never leave the database | Never include password relation |

### DO

| Pattern | Why |
|---------|-----|
| `getServerUser()` at the top of every protected route | Auth is per-route, not global |
| `sanitizeText()` / `sanitizeUrl()` before every DB write | Defense-in-depth against XSS |
| `parseBody(req, schema)` for all POST/PUT bodies | Validates + parses in one step |
| `prisma.$transaction()` for multi-step mutations | Atomic — no partial state on failure |
| `select: { ... }` for client-facing queries | Only returns what's needed |
| Rate limit on any endpoint that creates rows or calls APIs | Prevents abuse |
| Log errors with descriptive context | Makes debugging possible |

---

## 13. Checklist for New Endpoints

Before merging any new API route, verify:

- [ ] **Auth:** `getServerUser()` check at the top (unless intentionally public)
- [ ] **Validation:** Request body validated via `parseBody()` with a Zod schema
- [ ] **Sanitization:** All text inputs through `sanitizeText()`, all URLs through `sanitizeUrl()`
- [ ] **Ownership:** All Prisma queries include `userId: user.id` in the WHERE clause
- [ ] **Foreign keys:** Any user-provided foreign key (resumeId, coverLetterId, etc.) has ownership verified
- [ ] **Data minimization:** Client-facing responses use `select` (not raw `include`)
- [ ] **Rate limiting:** Applied if the endpoint creates rows, calls external APIs, or is expensive
- [ ] **Error handling:** try/catch with generic client message and detailed server log
- [ ] **Status codes:** Correct codes (400/401/403/404/409/429/500/503)
- [ ] **No mass assignment:** JSON blobs and dynamic data use explicit field allowlists
- [ ] **No `dangerouslySetInnerHTML`:** User content only rendered via `{value}` JSX
- [ ] **Query params:** Enumerated values validated with `z.enum()`, not parsed as free integers
- [ ] **Tests:** All new routes have test coverage for auth, validation, ownership, and happy path
