# 🏌️ Birdie — Golf Charity Subscription Platform

> Full-stack Next.js application built for the Digital Heroes trainee assignment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database + Auth | Supabase (Postgres + RLS + Storage) |
| Payments | Stripe (Subscriptions + Webhooks) |
| Styling | Tailwind CSS + Framer Motion |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone & Install

```bash
npm install
```

### 2. Supabase Setup

1. Create a **new Supabase project** at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `/supabase/schema.sql`
3. This creates all tables, triggers, RLS policies, storage buckets, and seeds 5 charities

### 3. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two products in Stripe Dashboard:
   - **Monthly** — £10/month recurring
   - **Annual** — £96/year recurring
3. Copy the **Price IDs** (start with `price_...`)
4. In Stripe → Developers → Webhooks, add endpoint:
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

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
```

### 5. Run Locally

```bash
npm run dev
```

### 6. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set all environment variables in Vercel dashboard → Settings → Environment Variables.

---

## Test Credentials

After deployment, create accounts via the signup flow:

### Admin Account
1. Sign up with any email
2. In Supabase → Table Editor → `profiles`, set `role = 'admin'` for your user
3. Admin panel accessible at `/admin`

### Subscriber Account
1. Sign up normally via `/signup`
2. Use Stripe test card: `4242 4242 4242 4242`, any future date, any CVC

---

## Key Features

### Score System
- Users enter Stableford scores (1–45) with a date
- **DB trigger** automatically enforces 5-score rolling window
- Oldest score is removed when 6th is added

### Draw Engine (`/lib/draw-engine.ts`)
- **Random mode**: Standard lottery, 5 unique numbers from 1–45
- **Algorithmic mode**: Inverted frequency weighting — least common user scores have highest draw probability
- Admin can simulate before publishing
- Jackpot rolls over to next month if no 5-match winner

### Prize Pools
| Match | Pool Share | Rollover |
|---|---|---|
| 5 Numbers | 40% | ✅ Yes (Jackpot) |
| 4 Numbers | 35% | ❌ No |
| 3 Numbers | 25% | ❌ No |

Multiple winners in same tier split the prize equally.

### Charity System
- Users select charity at signup (minimum 10% contribution)
- Contribution calculated on each subscription renewal via Stripe webhook
- Admin can manage charity listings, feature charities, upload images

### Winner Verification
- Winners upload proof screenshot
- Admin reviews: Approve → Verified → Mark as Paid
- Status flow: `pending → verified → paid` (or `rejected`)

---

## Project Structure

```
app/
  (public)/          — Landing, charities, draws (no auth)
  (auth)/            — Login, signup
  (dashboard)/       — User portal (protected)
  (admin)/           — Admin panel (admin role only)
  api/               — API routes (webhooks, draws, subscriptions)
lib/
  draw-engine.ts     — Core draw + prize pool logic
  stripe.ts          — Stripe config
  supabase.ts        — Browser client
  supabase-server.ts — Server + admin clients
  utils.ts           — Helpers
types/index.ts       — TypeScript types
supabase/schema.sql  — Full DB schema + triggers + RLS + seed data
```

---

## Architecture Decisions

**Why DB trigger for score limit?**
Moving the 5-score enforcement to a Postgres trigger means it's impossible to bypass via any client or API. No app-layer logic can accidentally create inconsistency.

**Why idempotent webhook handlers?**
Stripe may deliver webhooks more than once. All handlers use `upsert` with conflict resolution to prevent duplicate records.

**Why service role for admin operations?**
Admin API routes use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS — this is correct for trusted server-side admin actions. All other operations use the anon key with RLS enforced.

**Draw algorithm rationale:**
The inverted frequency weighting means numbers players rarely enter have the highest draw probability. This creates genuine lottery excitement because matching 5 numbers is harder, making the jackpot feel earned and driving jackpot rollovers.
