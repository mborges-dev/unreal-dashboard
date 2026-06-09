# UNREAL Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748.svg)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)

A full-stack business management dashboard built for a freelancer/agency. Covers the entire revenue lifecycle: lead capture, proposal tracking, project financials, content pipeline, and outreach automation.

## Features

### CRM & Lead Pipeline
- Kanban board across customisable stages (new → conversation → qualified → proposal → won/lost)
- Per-lead scoring with temperature (cold/warm/hot) and close-probability weighting
- Expected revenue calculated as `(setup + monthly × 12) × probability`
- Contact log per lead with channel (LinkedIn, email, WhatsApp) and direction tracking

### Proposals
- Dual-value model: one-off setup fee + recurring monthly retainer
- Annual total computed automatically (`setupValue + monthlyValue × 12`)
- Status lifecycle: draft → sent → negotiation → won/lost
- Linked back to the originating lead for pipeline continuity

### Project Financials
- Revenue and expense entries per project
- Cashflow view with monthly aggregates and Recharts visualisations

### Content & Editorial
- Idea backlog with status tracking (idea → in-progress → published)
- Publication records with platform, reach, and engagement metrics

### Media & Partners
- Media contact database with outreach stage tracking
- Partner registry with categorisation and notes

### Freelance Pipeline
- Tracks opportunities across Malt, Upwork, and direct channels
- Stage-weighted pipeline: each stage carries a close probability (applied 5%, replied 20%, call 40%, proposal 60%, won 100%)
- Weighted pipeline revenue = sum of `value × stageProbability` across all active opportunities
- Configurable monthly revenue target (`MONTHLY_GOAL_EUR` in `lib/freelance.ts`)

### WhatsApp Outreach Sequences (TheFacio)
- Multi-touch outreach sequences with typed message steps and configurable inter-message delays
- Progressive daily send limits (20 → 30 → 40/day) to stay within WhatsApp Business API warm-up constraints
- Rate limiting enforced at sequence execution time, not just configuration
- Lead deduplication by `place_id` and normalised phone number (E.164 PT mobile)

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| ORM | Prisma |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Date handling | date-fns |
| Excel import | xlsx |

## Architecture Notes

**`lib/freelance.ts`** — Stage probability table is the single source of truth for pipeline value calculations. Both the Kanban UI and the weighted revenue summary read from it. Setting `MONTHLY_GOAL_EUR` drives the progress indicator on the dashboard home.

**`lib/outreach.ts`** — Outreach sequences are defined as typed arrays of `{ message: string; delayHours: number }`. The executor layer reads `dailyLimit` from the sequence config and tracks sends per calendar day, progressively raising the cap as the account warms up. This matches the WhatsApp Business API recommendation to avoid account flags on new numbers.

**`scripts/import-master.ts`** — Idempotent upsert from an Excel sheet. Matches existing leads by `(projectId, name, company)` and rebuilds contact log entries from dated columns on each run. Handles Excel serial dates and comma-decimal numbers.

**`scripts/import-thefacio.ts`** — Bulk import of restaurant leads from a CSV export. Deduplicates by `place_id` and normalised E.164 phone. Only imports PT mobile numbers (`+3519xxxxxxxx`). Batches Prisma `createMany` calls in groups of 500 to avoid memory pressure on large files.

## Getting Started

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start the dev server
npm run dev
```

To import leads from an Excel file:

```bash
npx tsx scripts/import-master.ts path/to/leads.xlsx
```

To import TheFacio restaurant leads from a CSV:

```bash
npx tsx scripts/import-thefacio.ts path/to/leads.csv
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```
DATABASE_URL="file:./prisma/dev.db"   # SQLite for local dev
# DATABASE_URL="postgresql://..."     # PostgreSQL for production
```

---

## Notice

This repository is published as a **portfolio showcase** of my work. The code is **not licensed for reuse, redistribution, or modification.** You're welcome to read it, but it is not open source. If you'd like to discuss similar work, [get in touch](mailto:hello@miguelborges.dev).

---

Built by [Miguel Borges](https://miguelborges.dev) · [hello@miguelborges.dev](mailto:hello@miguelborges.dev)