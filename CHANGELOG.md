# Changelog

All notable changes to UNREAL Dashboard documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-06-04

Initial public release. Internal business-management dashboard for a freelance / agency operator.

### Added

- **CRM** — lead Kanban (new → conversation → qualified → proposal → won/lost), temperature scoring, expected revenue weighting
- **Proposals** — dual-value model (setup + monthly), annual total auto-calc
- **Outreach** — sequenced messaging with daily caps, WhatsApp Business rate-limit awareness, LinkedIn message-history parser
- **Growth pipeline** — content idea generator, media outreach tracker, partner relationship CRM
- **Per-project workspaces** — `app/[project]/...` routes for multi-brand operation
- **Financial tracking** — closing dashboard, proposal-to-revenue conversion, freelance platform tracker
- **CSV / XLSX import** — bulk lead import with deduplication and Excel-date normalization

### Stack

Next.js 14 (App Router) · React 18 · TypeScript · Prisma · SQLite (local) · Tailwind CSS

### Known limitations

- No automated tests
- SQLite for local dev; production deployment uses Postgres but migrations live elsewhere
- Documentation focused on internal use; setup guide is minimal