# RoboResume — AI-Powered Resume Builder

A full-stack SaaS resume builder with AI-assisted writing, multiple export formats, Stripe subscriptions, and a multi-step guided builder. Built with Next.js 15, Prisma, PostgreSQL, and OpenAI.

---

## Features

- **AI Writing Assistance** — GPT-4o-mini generates professional summaries, job description bullet points, and full cover letters tailored to specific job postings
- **Multi-Step Builder** — 8-step guided wizard with real-time live preview, form validation at each step, and debounced auto-save
- **4 Professional Templates** — Modern, Classic, Minimalist, and Creative (sidebar layout), each rendered as both an HTML preview and a styled PDF
- **Multiple Export Formats** — Download as PDF (`@react-pdf/renderer`), Word DOCX (`docx`), with the original resume data preserved for future edits
- **Cover Letter Generator** — Standalone tool in the dashboard to generate and save cover letters without needing a resume
- **Stripe Billing** — Full subscription lifecycle: free trial (5 AI assists), Pro plan (unlimited), webhook-driven activation/cancellation, invoice history, and Stripe billing portal
- **Auth System** — Email/password authentication with JWT sessions, email verification, and password reset via Resend
- **Dashboard** — Manage all resumes and cover letters with live thumbnail previews, usage tracking, and billing management
- **Autocomplete** — Trie-based autocomplete for skills and languages with a curated dataset of 200+ skills and 90+ languages

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, React Server Components) |
| **Language** | TypeScript 5 (strict mode) |
| **Database** | PostgreSQL via Prisma ORM 7 |
| **Auth** | @robojs/auth + @auth/prisma-adapter (JWT strategy) |
| **AI** | OpenAI API (GPT-4o-mini) |
| **Payments** | Stripe (subscriptions, webhooks, billing portal) |
| **Email** | Resend (transactional emails with HTML templates) |
| **PDF Export** | @react-pdf/renderer |
| **Word Export** | docx |
| **State** | Jotai (atomic client state) |
| **UI** | Tailwind CSS, Radix UI, Motion (animations) |
| **Fonts** | Roboto Flex (variable font via next/font/google) |
| **Icons** | Lucide React, Material Symbols |
| **Runtime** | Robo.js + @robojs/server |

---

## Architecture Overview

```
resume-builder/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── ai/                 # AI endpoints (assist, cover-letter, suggestions)
│   │   ├── resumes/            # Resume CRUD with smart sync
│   │   ├── cover-letters/      # Cover letter CRUD
│   │   ├── checkout/           # Stripe checkout session
│   │   ├── stripe/             # Billing portal + invoices
│   │   ├── user/               # Account management (update, delete, export)
│   │   └── webhooks/stripe/    # Stripe webhook handler
│   ├── auth/                   # Login / register page
│   ├── builder/                # Resume builder (8-step wizard)
│   │   └── steps/              # TemplateSelection, ContactInfo, ExperienceSkills,
│   │                           # ProfessionalSummary, Education, ProjectsExtras,
│   │                           # TargetJob, ReviewExport
│   ├── dashboard/              # User dashboard
│   │   ├── billing/            # Subscription management
│   │   ├── cover-letters/      # Cover letter manager
│   │   └── settings/           # Account settings
│   └── layout.tsx              # Root layout (Jotai, Toaster, Cookie banner)
├── src/
│   ├── components/
│   │   ├── builder/            # Form field components, template selector, nav buttons
│   │   ├── dashboard/          # ResumeCard (live thumbnail), UsageDisplay
│   │   ├── pdf/                # ResumePDF (@react-pdf/renderer)
│   │   └── ui/                 # Radix UI wrappers (Button, Card, Dialog, etc.)
│   ├── lib/
│   │   ├── trie.ts             # Autocomplete data structure
│   │   ├── docx-generator.ts   # Word export
│   │   ├── subscription.ts     # Quota checking + trial expiry logic
│   │   ├── rate-limit.ts       # Sliding-window in-memory rate limiter
│   │   └── pdf-templates.ts    # Per-template color/font config for PDF
│   ├── stores/
│   │   ├── builder.ts          # Resume data atom + step validation functions
│   │   └── user.ts             # Authenticated user atom
│   └── lib/templates.tsx       # 4 HTML resume templates (shared BaseResumeLayout)
└── prisma/schema.prisma        # Full data model
```

---

## Data Model

The core entities and their relationships:

- **User** → has many Resumes, CoverLetters; has subscription fields (status, usageCount, usageLimit, billingPeriod)
- **Resume** → has many Experiences, Skills, Education, Projects, Certifications, Languages; stores template ID and contactInfo as JSON
- **CoverLetter** → belongs to User; optionally linked to a Resume; has title, content, status, job metadata
- **Stripe** → webhook-driven lifecycle: `checkout.session.completed` → ACTIVE; `subscription.deleted` → INACTIVE; usage resets on each billing period renewal

---

## Subscription Model

| Tier | Status | AI Assists | Templates |
|------|--------|-----------|-----------|
| Free trial (7 days) | `TRIAL` | 5 | All 4 |
| Free | `INACTIVE` | 5/month | All 4 |
| Pro | `ACTIVE` | Unlimited | All 4 |

Usage is tracked per billing period via `usageCount` / `usageLimit` on the User model. The `canUseAIFeatures()` utility handles quota checks with an admin bypass for development.

---

## AI Features

All AI routes authenticate the user, check quota via `canUseAIFeatures()`, call GPT-4o-mini, then increment usage with `incrementUsage()`.

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `POST /api/ai/assist` | Generate summary or job description bullets | 20/hr |
| `POST /api/ai/cover-letter` | Generate a cover letter (resume optional) | 20/hr |
| `POST /api/ai` | Resume improvement suggestions for a target job | 30/hr |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- OpenAI API key
- Stripe account (test keys work fine)
- Resend account for email

### Installation

```bash
git clone https://github.com/your-username/resume-builder.git
cd resume-builder
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/resume_builder"

# Auth — generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"

# Email (Resend)
RESEND_API_KEY="re_..."

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# App
APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Optional: bypass AI quota for development
ADMIN_EMAIL="your@email.com"
```

### Database Setup

```bash
npx prisma migrate dev
```

### Development

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

### Stripe Webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Key Implementation Details

### Auto-Save Race Condition Prevention
The builder uses a `resumeIdRef` (React ref) alongside the Jotai atom to prevent a race condition where concurrent auto-save and manual-save calls could each create a new resume instead of updating. The ref is updated synchronously on the first save response and read by all subsequent saves.

### Live Resume Thumbnails
Dashboard resume cards render the actual template component at 33% scale using CSS `transform: scale(0.33)` with `transformOrigin: top left` inside an `overflow: hidden` container — no separate render pipeline or image generation needed.

### Smart Sync
The resume CRUD endpoint uses a "smart sync" pattern: on every save, it diffs the incoming array of items against what's in the database and issues targeted creates, updates, and deletes in a single `Promise.all` — avoiding full deletes and re-inserts.

### Trie Autocomplete
Skill and language inputs use a `TrieManager` class with depth-first search to return suggestions as you type. The dataset is loaded once and the Trie is built in-memory for fast lookups.

---

## License

MIT
