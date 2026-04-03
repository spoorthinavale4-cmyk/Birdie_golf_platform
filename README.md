# Birdie — Golf Charity Subscription Platform

> A full-stack subscription platform where golfers log scores, enter monthly prize draws, and direct a portion of every membership to a charity of their choosing. Built with a production-grade architecture using real infrastructure throughout.

---

## Overview

Birdie is a premium golf membership product with three interlocking pillars:

- **Score tracking** — Members log Stableford rounds; their five most recent scores become their active draw entries for the month.
- **Monthly prize draw** — A transparent, tiered lottery engine matches member scores against drawn numbers, distributing a live prize pool across three winning tiers.
- **Charitable giving** — Every subscription directs a minimum of 10% to a member-selected cause, with impact visible throughout the member experience.

The platform spans a public landing experience, a protected member dashboard, and a full admin panel for draw management, winner verification, and charity curation.

---

## A Note on Payments

> **Stripe integration is present in architecture but not live in this deployment.**
>
> The payment flow — subscription creation, webhook handling, and renewal-based charity contribution calculation — is fully implemented in code using Stripe's API. However, due to Stripe account verification constraints, the deployed version uses a **simulated/dummy payment system** that mirrors the real flow without processing actual transactions.
>
> All other infrastructure — authentication, database, row-level security, draw logic, admin workflows, charity data — is **entirely real and production-grade**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database & Auth | Supabase — PostgreSQL, Row-Level Security, Storage |
| Payments (architecture) | Stripe — Subscriptions, Webhooks, Price IDs |
| Styling | Tailwind CSS v3, Framer Motion |
| Deployment | Vercel |
| Language | TypeScript throughout |

---

## Core Features

### Score System
- Members submit Stableford scores (1–45) with a round date
- A **Postgres trigger** enforces a strict 5-score rolling window at the database level — the oldest score is dropped automatically when a sixth is added
- Enforcement lives at the DB layer, making it impossible to bypass through any client or API

### Draw Engine (`/lib/draw-engine.ts`)
- **Random mode** — Standard lottery draw: 5 unique numbers from 1–45
- **Algorithmic mode** — Inverted frequency weighting: numbers members have entered least frequently carry the highest draw probability, creating genuine excitement and making jackpot hits feel meaningful
- Admins can simulate a draw privately before publishing results
- Jackpot rolls over to the following month if no 5-match winner is found

### Prize Structure

| Tier | Pool Allocation | Jackpot Rollover |
|---|---|---|
| 5 Numbers matched | 40% | Yes — carries to next draw |
| 4 Numbers matched | 35% | No |
| 3 Numbers matched | 25% | No |

Winners within the same tier split that tier's allocation equally.

### Charity System
- Charity selected by the member at signup
- A minimum 10% contribution is built into every plan
- Contribution amounts are calculated per renewal via Stripe webhook events
- Admins can manage the charity directory, feature organisations, and upload imagery

### Winner Verification
- Winners upload a proof screenshot via the member dashboard
- Admins review and progress through a formal status flow: `pending → verified → paid` (or `rejected`)
- Keeps winnings accountable and auditable

---

## Project Structure

```
app/
  (public)/           Public pages — landing, charities, draw results
  (auth)/             Authentication — login, signup
  (dashboard)/        Protected member portal
  (admin)/            Admin panel — draws, winners, charities, users
  api/                API routes — webhooks, draw runner, subscription creation

lib/
  draw-engine.ts      Core draw and prize pool logic
  stripe.ts           Stripe client configuration
  supabase.ts         Browser-side Supabase client
  supabase-server.ts  Server and admin Supabase clients
  utils.ts            Shared utilities and helpers

types/index.ts        Full TypeScript type definitions
supabase/schema.sql   Complete DB schema — tables, triggers, RLS policies, seed data
```

---

## Architecture Decisions

**Database-level score enforcement**
Moving the 5-score limit to a Postgres trigger means it cannot be circumvented by any application layer or API call. Consistency is guaranteed at the data source.

**Idempotent webhook handlers**
Stripe may deliver the same event more than once. All webhook handlers use `upsert` with conflict resolution to ensure duplicate deliveries are safe and produce no side effects.

**Service role for admin operations**
Admin API routes use `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS intentionally for trusted server-side actions. All member-facing operations use the anon key with full RLS enforcement.

**Algorithmic draw rationale**
Inverted frequency weighting ensures that rarely-entered numbers are most likely to appear in the draw result. This makes matching all five numbers genuinely hard, sustaining jackpot interest across rollovers and rewarding members who engage consistently.

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the full contents of `supabase/schema.sql`
3. This provisions all tables, triggers, RLS policies, storage buckets, and seeds the charity directory

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Run the dev server

```bash
npm run dev
```

---

## Deployment

The project deploys to Vercel with zero additional configuration beyond environment variables.

```bash
vercel --prod
```

Set all variables listed above in **Vercel → Settings → Environment Variables**, including `NEXT_PUBLIC_SITE_URL` pointing to your live domain.

---

## Admin Access

1. Sign up via `/signup` using the email set as `ADMIN_EMAIL`
2. In Supabase → Table Editor → `profiles`, set `role = 'admin'` manually
3. Admin panel is then accessible at `/admin`

For testing subscriptions in a real Stripe environment, use test card `4242 4242 4242 4242` with any future expiry and any CVC.

---

*Birdie — Play better rounds. Turn them into something bigger.*
