# The W Gym & Sauna

Website, membership system and sauna booking engine for The W Gym & Sauna at
Wicklow Rugby Club, Ireland.

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Prisma 7 / PostgreSQL ·
Auth.js · Stripe · Resend · React Three Fiber

---

## Getting started

```bash
npm install
cp .env.example .env
npm run db:dev          # starts a local Postgres (leave running)
npm run db:migrate      # applies the schema
npm run db:seed         # plans, services, trainers, opening hours
npm run dev
```

The site runs without Stripe or Resend credentials. Missing keys degrade
gracefully rather than crashing:

- **No `STRIPE_SECRET_KEY`** — memberships and bookings are created and
  confirmed without taking payment, and the UI says so plainly.
- **No `RESEND_API_KEY`** — emails are printed to the server console instead of
  being sent. Sign-in links appear there, so you can log in.

Add the keys and both flows switch over with no code change.

### Becoming an admin

Sign in once at `/signin` with the address in `SEED_OWNER_EMAIL`, then re-run
`npm run db:seed` to promote that account to `OWNER`.

---

## Checks

```bash
npm run check              # typecheck + lint + timezone assertions
npm run check:db           # concurrency + double-booking (needs the database)
npm run check:routes       # every route responds correctly (needs the server)
npm run check:guards       # role-based access control (needs the server)
npm run check:webhook      # Stripe signature verification (see below)
```

`check:webhook` needs the server running with test Stripe values:

```bash
STRIPE_SECRET_KEY=sk_test_x STRIPE_WEBHOOK_SECRET=whsec_test_secret_for_checks npm start
```

then in another terminal:

```bash
STRIPE_WEBHOOK_SECRET=whsec_test_secret_for_checks npm run check:webhook
```

No network call to Stripe is made — signatures are constructed locally.

---

## Two rules worth knowing before you edit

**1. Never run Prisma queries in parallel.** Always `await` them one after the
other; never wrap them in `Promise.all`. With this driver stack, concurrent
queries from one client interleave on a pooled connection and their bind
parameters cross over — which can return the *wrong rows* rather than raising
an error. Measured: 4 concurrent requests × 3 parallel queries failed 15 times
in 60; the same work awaited sequentially passed 60/60. The full explanation is
at the top of [`src/lib/db/prisma.ts`](src/lib/db/prisma.ts), and
`npm run check:concurrency` guards it.

**2. Times are stored in UTC, displayed in Europe/Dublin.** All conversion goes
through [`src/lib/booking/time.ts`](src/lib/booking/time.ts). Opening hours are
stored as wall-clock minutes and projected onto a date at query time, so 06:00
stays 06:00 across both daylight-saving changes. `npm run check:tz` asserts
this, including the 23- and 25-hour days.

---

## How the important parts work

### Booking

Availability is generated **server-side only** from opening hours, duration,
buffer, capacity, closures, minimum notice and booking horizon. The browser
asks for a date and gets slots back; the same check runs again inside the
booking transaction, so a stale or hand-crafted request cannot book a closed
day or a full slot.

Double booking is prevented by a transaction-scoped Postgres advisory lock keyed
on (service, slot start). Every writer for a slot takes the same lock before
counting, so the count and the insert are atomic with respect to each other.
`npm run check:booking` fires 18 simultaneous bookings at a 6-person slot and
asserts exactly 6 succeed.

A booking holds capacity as `PENDING` while the customer pays, and the hold
expires if they abandon checkout.

### Payments

Prices are always read from the database row server-side. The client never
supplies an amount. Nothing is marked paid by the browser: the redirect back
from Stripe is treated as a hint, and only the signature-verified webhook sets
`CONFIRMED` / `ACTIVE`. Handlers are idempotent, since Stripe retries.

### Access control

Guards live in route **layouts**, so a page added later is protected by default.
A signed-out visitor is redirected to sign-in; a signed-in member without the
role gets a 404 rather than a redirect loop that could never succeed.

---

## What still needs supplying

Everything unknown is a visible placeholder rather than invented data.

| Item | Where | Notes |
|---|---|---|
| Photography | [`src/config/media.ts`](src/config/media.ts) | Each slot has a written brief and alt text. Drop files into `/public/media` and fill in `src`. |
| Logo | [`src/components/brand/Logo.tsx`](src/components/brand/Logo.tsx) | Placeholder mark; single swap point marked in the file. |
| Prices & plans | Admin → Plans | Seeded values are structural placeholders. Set `PRICING_IS_PROVISIONAL = false` in [`src/config/catalogue.ts`](src/config/catalogue.ts) once real. |
| Opening hours | Admin → Availability | Set `OPENING_HOURS_ARE_PROVISIONAL = false` in [`src/config/site.ts`](src/config/site.ts) once confirmed. |
| Phone number | Admin → Settings | Empty by design — hidden everywhere until set, rather than shown blank. |
| Trainer qualifications | Database `Trainer.qualifications` | Empty; the block is omitted rather than filled with invented credentials. |
| Testimonials | [`src/components/marketing/Testimonials.tsx`](src/components/marketing/Testimonials.tsx) | Deliberately empty. No fabricated reviews. |
| Legal documents | `src/app/legal/*` | Written for this business but **not reviewed by a solicitor**. Each carries a visible draft notice. |

---

## Deploying

1. Provision PostgreSQL (Neon, Supabase, Prisma Postgres…).
2. Set every variable in `.env.example`. `DATABASE_POOL_MAX` must leave room
   for the pool *times the number of build workers* under the provider's
   connection limit.
3. `npm run db:deploy && npm run db:seed`
4. Point a Stripe webhook at `/api/stripe/webhook` for
   `checkout.session.completed`, `checkout.session.expired`, `invoice.paid`,
   `invoice.payment_failed`, `customer.subscription.updated`,
   `customer.subscription.deleted`.
5. Verify the DNS domain in Resend and set `EMAIL_FROM` to it.

Marketing pages are statically generated and revalidated by the admin actions
that change them, so an edited price takes effect without a redeploy.
