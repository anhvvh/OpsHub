# OpsHub — Product Requirements Document (PRD)

*Version 1.2 — synthesized from [research.md](research.md) and the scoping decisions made in the grilling session of 2026-07-14; revised 2026-07-17 to reconcile the Database Model, Sample Data, and Implementation Decisions with the imported design prototype and the resulting build (schema fields, product catalogue, worked examples); revised again 2026-07-17 after building and testing the AI-insight rule engine and the two write-path server actions test-first (§Testing Decisions now reflects the real suite, not a plan). Portfolio MVP: one builder, ~2 working days, AI-assisted.*

---

## Problem Statement

Small e-commerce merchants run their business across five or six disconnected tools — storefront admin, marketplace seller portals, payment provider dashboards, inventory tools, and spreadsheets. No single place answers *"how is my business doing right now, and what needs my attention?"* Monitoring is manual: problems like stockouts, failed payments, refund spikes, or revenue dips are discovered late — often by a customer complaint or a smaller-than-expected payout. Research cited in [research.md](research.md) puts the cost at up to 14 hours/week of tool-switching for multi-channel merchants.

Existing tools don't solve this: ERPs are months-long, five-figure implementations built for accounting completeness rather than daily situational awareness; e-commerce admins and payment dashboards are each siloed to their own domain; spreadsheets are manual and decay instantly. None of them synthesizes cross-functional signals ("refunds are up AND payment failures are up AND it's hitting revenue") proactively.

## Solution

**OpsHub** — a lightweight, AI-powered Merchant Operations Cockpit. One clean web dashboard that consolidates the four things a small merchant checks every day — orders, inventory, payments, and revenue — and adds an **AI Operations Assistant** that proactively surfaces a small number of prioritized, actionable insights instead of waiting to be asked.

OpsHub is **not** a POS, not an ERP, and not a store builder. It is a read-mostly monitoring cockpit with a handful of high-value actions (updating order status, adjusting stock), designed so a merchant grasps the state of their business in under two minutes each morning.

**This is a portfolio MVP.** The purpose is to demonstrate Product Management, Business Analysis, Information Systems, and Solution Architecture thinking — not commercial release. Success is defined as: *a reviewer can grasp the problem, the product thinking, and the value within ~2 minutes of opening the live app or README, and the execution (design polish, coherent data, working AI insights) reads as credible rather than a rough prototype.*

## Target Users

**Primary — Maria, the owner-operator.** Founder and sole full-time employee of a Swedish direct-to-consumer skincare brand (3 years old, 40–80 orders/day, ~150 SKUs, selling via her own Shopify store plus Amazon). Comfortable with SaaS dashboards, not a developer. Wants to catch problems before customers or her accountant do, and spend less time "checking things" across 4–5 tabs every morning.

**Secondary — Jonas, the operations assistant.** Part-time/junior hire at a slightly larger small merchant (5–10 people). Handles daily order triage and customer service; needs a simple, guided view of what needs attention without admin access to every backend tool.

*(Full personas in [research.md](research.md) §2.)*

## User Stories

### Module 1 — Merchant Dashboard

1. As a merchant, I want to see today's revenue at a glance, so that I know how the day is going without opening my payment provider.
2. As a merchant, I want to see today's order count, so that I can gauge sales activity immediately.
3. As a merchant, I want to see the number of pending payments, so that I know how much money is in flight.
4. As a merchant, I want to see open refund requests, so that I can spot customer-satisfaction problems early.
5. As a merchant, I want low-stock alerts surfaced on my home screen, so that I never run out of a bestseller during a promotion again.
6. As a merchant, I want AI-generated insights displayed prominently on the dashboard, so that the most important issues find me instead of me hunting for them.
7. As a merchant, I want each dashboard metric and alert to link to the relevant detail screen, so that I can go from "something's wrong" to "here's the detail" in one click.
8. As a merchant, I want today's numbers shown with a comparison to a prior period, so that I can tell whether today is normal or unusual.
9. As an operations assistant, I want the dashboard to be legible without configuration, so that I can triage the day without training on an ERP.

### Module 2 — Orders

10. As a merchant, I want a list of all orders with status badges, so that I can see the state of my order pipeline at a glance.
11. As a merchant, I want to filter orders by status (Pending payment / Paid / Fulfilled / Delivered / Refunded / Cancelled), so that I can work one queue at a time.
12. As a merchant, I want to open an order's detail page, so that I can see its line items, customer, amounts, and payment state in one place.
13. As a merchant, I want a timeline of events on each order (placed → paid → fulfilled → delivered / refunded), so that I can reconstruct what happened without checking multiple tools.
14. As a merchant, I want to manually update an order's status, so that I can keep the pipeline accurate when something happens outside the system — and have that change persist.
15. As a merchant, I want a status change to appear in the order's timeline, so that there is a trace of who-did-what-when.
16. As an operations assistant, I want the order list sorted with newest/most-actionable first, so that daily triage starts at the right place.

### Module 3 — Inventory

17. As a merchant, I want a product list showing current stock levels, so that I can review stock health without a warehouse tool.
18. As a merchant, I want products below their low-stock threshold visually flagged, so that at-risk SKUs stand out immediately.
19. As a merchant, I want a product detail page (price, SKU, stock, threshold, recent sales), so that I can judge whether to reorder.
20. As a merchant, I want to manually adjust a product's stock count, so that I can correct the number after a physical count or an off-system sale — and have that change persist.
21. As a merchant, I want low-stock alert logic to re-evaluate immediately after I adjust stock, so that the cockpit always reflects reality.
22. As an operations assistant, I want to spot-check stock before promising a delivery date, so that I don't promise what we can't ship.

### Module 4 — Payments

23. As a merchant, I want a payments list with statuses (pending / succeeded / failed / refunded), so that payment health is visible without opening Stripe or Klarna.
24. As a merchant, I want failed payments called out separately, so that I catch processor problems within hours, not days.
25. As a merchant, I want to see refund statuses, so that I know which customers are still waiting for money back.
26. As a merchant, I want a daily payment summary (totals by status, modeled on Stripe's Balance / Klarna's Settlements pattern), so that end-of-day reconciliation takes seconds.
27. As a merchant, I want each payment linked to its order, so that I can jump from a failed payment to the affected order in one click.

### Module 5 — AI Operations Assistant

28. As a merchant, I want to be proactively warned when a product's stock falls below its threshold, so that I reorder before I sell out.
29. As a merchant, I want to be warned when the payment failure rate rises abnormally, so that I catch processor or fraud issues early.
30. As a merchant, I want to be alerted when revenue is trending down versus the prior period, so that I can investigate before month-end.
31. As a merchant, I want to be told when a product is selling unusually well, so that I can protect its stock and push marketing on it.
32. As a merchant, I want to be alerted to a refund spike, so that I can find the root cause (a bad batch, a listing error) quickly.
33. As a merchant, I want each insight shown as a short, number-first headline plus one brief suggested action, so that I grasp *what's happening* in a glance and know *what to do* without reading a paragraph.
34. As a merchant, I want insights ranked by severity and kept to a small number, so that the assistant never becomes a noisy feed I learn to ignore.
35. As a merchant, I want each insight to deep-link to the relevant product, order, or payment view, so that acting on an insight takes one click.

## List of Windows (Screens)

| # | Window | Route | Contents |
|---|--------|-------|----------|
| 1 | Merchant Dashboard | `/` | KPI cards (revenue today, orders today, pending payments, open refunds) with prior-period comparison; low-stock alert list; AI Insights panel (ranked, max ~5); everything cross-linked |
| 2 | Orders list | `/orders` | Table: order #, date, customer, channel, total (SEK), status badge; status filter tabs; newest first |
| 3 | Order detail | `/orders/[id]` | Customer info, line items, totals, linked payment state, event timeline, status-update control |
| 4 | Inventory list | `/inventory` | Table: product, SKU, price, current stock, threshold, low-stock flag; low-stock rows visually distinct |
| 5 | Product detail | `/inventory/[id]` | Product info, stock level vs. threshold, recent sales snapshot, stock-adjustment control |
| 6 | Payments | `/payments` | Daily summary card (totals by status); payments table with status badges and failure reasons; failed payments section; each row links to its order |

All six windows share a persistent navigation shell (sidebar or top nav) with the OpsHub identity. The AI Assistant is a first-class panel on the Dashboard, not a separate window — keeping insights on the home screen is the "cockpit" premise.

## Database Model

Postgres, hosted on Supabase, via Prisma. Amounts stored as integer öre (SEK minor units). Two connection strings, not one: `DATABASE_URL` (transaction-mode pooler, port 6543) for app queries, `DIRECT_URL` (session-mode pooler, port 5432) for migrations, since DDL cannot run under pgbouncer's transaction pooling.

```prisma
model Product {
  id                String      @id @default(cuid())
  sku               String      @unique
  name              String
  category          String                  // e.g. "Serums", "Cleansers", "Bundles"
  description       String?
  priceOre          Int                     // original price
  promoPriceOre     Int?                    // current promotional price, if on promo
  stockQuantity     Int
  lowStockThreshold Int         @default(10)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  orderItems        OrderItem[]
}

model Order {
  id              String       @id @default(cuid())
  orderNumber     String       @unique       // e.g. "OH-1042"
  customerName    String
  customerEmail   String
  shippingAddress String
  channel         String                     // SHOPIFY | AMAZON
  status          String                     // Shopify-style lifecycle, see below
  totalOre        Int
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  items           OrderItem[]
  payment         Payment?
  events          OrderEvent[]
}

model OrderItem {
  id           String  @id @default(cuid())
  orderId      String
  productId    String
  quantity     Int
  unitPriceOre Int                          // price at time of sale
  order        Order   @relation(fields: [orderId], references: [id])
  product      Product @relation(fields: [productId], references: [id])
}

model Payment {
  id            String   @id @default(cuid())
  paymentNumber String   @unique             // e.g. "PMT-4471"
  orderId       String   @unique
  provider      String                       // STRIPE | KLARNA
  status        String                       // PENDING | SUCCEEDED | FAILED | REFUNDED
  amountOre     Int
  failureReason String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  order         Order    @relation(fields: [orderId], references: [id])
}

model OrderEvent {
  id          String   @id @default(cuid())
  orderId     String
  type        String                        // ORDER_PLACED | PAYMENT_RECEIVED | PAYMENT_FAILED | FULFILLED | DELIVERED | STATUS_CHANGED | REFUNDED | CANCELLED
  description String
  createdAt   DateTime @default(now())
  order       Order    @relation(fields: [orderId], references: [id])
}
```

**Lifecycle fields are `String`, not native Prisma/Postgres enums.** `channel`, `status`, `provider`, and payment `status` are validated by typed constants in `src/lib/domain.ts` (`ORDER_STATUSES`, `CHANNELS`, `PROVIDERS`, `PAYMENT_STATUSES`) rather than a database-level enum, so adding a new status later never requires a schema migration. `domain.ts` also encodes `ALLOWED_TRANSITIONS` — the legal moves between order statuses — so the order-detail status control can only ever offer a legal next state, not an arbitrary jump.

**Deliberately absent:** an `Insight`/alert table. AI insights are **computed live** from current data by the rule engine on each dashboard load — they are not stored and not dismissible (a merchant "resolves" an insight by fixing the underlying condition, which makes the insight disappear on recompute). A small server-side cache of generated LLM text (keyed by insight fingerprint) is an allowed implementation optimization to avoid re-calling the LLM for an unchanged insight; it is a cache, not a domain entity.

**Security:** every table has Row Level Security enabled with **no policies**, and the Supabase `anon`/`authenticated` roles are revoked outright — the public API grants zero access even if the publishable key ends up in client-side code. Prisma reaches Postgres as the owner role over `DATABASE_URL`/`DIRECT_URL`, which bypasses RLS by design; that pair is the only secret the app needs. The Supabase anon key and service_role key are deliberately **not** stored anywhere — nothing in the app uses `supabase-js`, so holding those keys would add risk (service_role bypasses every RLS rule) with no corresponding use.

## Sample Data

One seeded merchant: **"Hälsa Skincare"** (Maria's Swedish DTC brand). All monetary values in SEK, SKUs prefixed `HAL-`. Seed script requirements:

- **12 products** across 7 categories (Serums, Cleansers, Balms, Creams, Bundles, Toners, Masks, Oils), prices roughly 209–899 kr. Each product carries both an **original price** (`priceOre`) and an optional **current promotional price** (`promoPriceOre`) — most products are on a store-wide promo, shown as a struck-through original price beside the live promo price. This is a real Inventory/Product-detail UI element, not just seed-data flavor.
- **~30 days of orders** (roughly 40–80/day is the persona's scale; ~300–500 seeded orders is enough to look real while keeping seeds fast), across both channels (~70% Shopify / 30% Amazon), with realistic status distribution (most Delivered, a working set of Paid/Fulfilled, a few Pending payment/Refunded/Cancelled) and Swedish customer names, addresses, and email domains.
- **A payment per order**, split across Stripe and Klarna, statuses consistent with order statuses, plausible failure reasons ("card_declined", "insufficient_funds") on failed ones.
- **Order events** forming a coherent timeline for every order.
- Order and payment reference numbers follow the prototype's convention: `OH-####` for orders, `PMT-####` for payments.

The seed data must **deliberately engineer all five insight scenarios** so the AI Assistant demos reliably:

1. **Low stock:** bestseller "Lavender Face Serum" (`HAL-SER-LAV`) at 4 units against a threshold of 15, plus two more products just under their own thresholds ("Rosehip Cleansing Oil" 9/12, "Sea Buckthorn Balm" 11/15).
2. **Payment failure rate rising:** a cluster of failed payments in the last 24h that pushes the failure count over threshold.
3. **Revenue declining:** last-7-days revenue seeded meaningfully below the prior 7 days (≈ −20%).
4. **Product selling unusually well:** "Vitamin C Brightening Serum" (`HAL-SER-VITC`) selling at roughly 3× its prior-week rate.
5. **Refund spike:** refunds up roughly 40% week-over-week, concentrated on "Rosehip Night Cream" (`HAL-CRM-ROS`).

## Implementation Decisions

- **Stack:** Next.js (React + TypeScript) full-stack app; Next.js **Server Actions** (not separate API routes) implement the two write paths, called directly from the existing client components — keeping all secrets (Claude API key, database connection strings) server-side without hand-written fetch/API plumbing. Fonts (Newsreader, IBM Plex Sans, IBM Plex Mono) are self-hosted via `next/font` rather than linked from Google Fonts, avoiding a render-blocking third-party request. Deployed to a live Vercel URL. Postgres via Prisma, hosted on Supabase (SQLite rejected because writes must persist on serverless hosting).
- **Data strategy:** fully seeded/mock data; **no live integrations** with Shopify/Stripe/Klarna/Amazon. Architecture keeps data access behind a thin repository/service layer so a real integration could be swapped in later (documented as future work, not built). The UI was built first against a typed mock module (`src/lib/mock.ts`) shaped identically to the Prisma models, so wiring the screens to real queries later is a data-source swap, not a rewrite.
- **Tenancy & auth:** single seeded merchant; **no authentication** — the app opens directly on the Dashboard.
- **Order lifecycle:** Shopify-style vocabulary (`PENDING_PAYMENT → PAID → FULFILLED → DELIVERED`, terminal `REFUNDED`/`CANCELLED`) — the convention research.md identified as the cross-industry baseline. The order-detail status control only ever offers the *legal* next states per `ALLOWED_TRANSITIONS` (e.g. a Delivered order can only move to Refunded) — it cannot express an illegal jump.
- **Persisted writes (exactly two):** manual order-status update and manual stock-count adjustment. Both write to Postgres; a status update also appends an `OrderEvent`. Everything else is read-only or ephemeral UI state. `adjustStock` takes the new absolute quantity (not a relative delta) and rejects anything that isn't a whole number ≥ 0 — the simpler of the two designs, chosen because OpsHub is single-user with no concurrent-edit risk to guard against. Both actions return a result object (`{ok: true, data}` or `{ok: false, error}`) rather than throwing, and both reject an unknown order/product id without crashing.
- **Rate-of-change comparisons round before thresholding, not after.** Testing the rule engine surfaced a real bug: `9/10 - 1` evaluates to `-0.09999999999999998` in IEEE754, not exactly `-0.1`, so comparing the raw float against a threshold silently missed a true 10%/40% change in two of the five rules (`revenueDownRule`, `refundSpikeRule`). Fixed by rounding to the display percentage first and comparing on that integer — the convention any future rate-of-change rule should follow.
- **AI Assistant architecture — rules decide, LLM phrases tersely:** a deterministic rule engine (pure functions over queried data) decides *when* each of the five insight types fires and computes the underlying numbers; a server-side Claude API call turns those numbers into a **short, number-first headline plus one brief action line (≤ ~8 words)** — e.g. headline `"Refunds +40% — 6 of 9 on Rosehip Night Cream"`, action `"Check the latest batch."` The insight text must stay scannable, not a paragraph. If the LLM call fails, the UI falls back to template text built from the same numbers — the demo must never break on an API hiccup. On the dashboard itself, insights are ranked and only the top few are shown as cards (one lead insight, up to two secondary); this is not all five types simultaneously — a merchant sees what's currently active and severe, not an exhaustive list.
- **Alert logic (mixed, per decision):** fixed thresholds for stock (`stockQuantity < lowStockThreshold`) and payment failures (count over threshold in a rolling window); rate-of-change vs. prior comparable period for revenue decline, hot-selling product, and refund spike. Exact numeric constants live in one config module.
- **Cross-linking is a requirement, not polish:** every KPI, alert, and insight deep-links to the relevant detail screen (low stock → product detail, refund spike → filtered orders/payments, failed payments → payments view).
- **Product pricing has two tiers:** `priceOre` (original) and an optional `promoPriceOre` (current promotional price). Where a promo price exists, Inventory and Product Detail show the original price struck through beside the live promo price — this surfaced during the build as a natural extension of "what a merchant actually needs to see about a product," not a scope addition requiring separate justification.
- **Orders table supports per-column filtering**, not just the status tabs: each column header carries a caret that opens a checkbox popover of that column's distinct values (e.g. filter to only Amazon orders, or only orders from one customer), composable with the status tab. This is beyond what the original Module 2 scope specified (status filter only) — kept because it was near-zero incremental cost once the table existed, but it's the one place the build added interaction surface beyond the spec; cut first if the two-day budget is tight.
- **Visual direction:** warm, editorial minimalism, now a concrete decided system rather than a description — cream paper (`#fdfaf4`), near-black ink (`#26231d`), a terracotta accent (`#b5623f`), with Newsreader (serif, headings/figures) paired against IBM Plex Sans (body/UI) and IBM Plex Mono (labels, order/SKU codes). Tokens live as CSS custom properties in `src/app/globals.css`. Explicitly not enterprise-cluttered (SAP/Amazon cautionary examples) and not generic SaaS blue-and-white. Currency formatted as SEK (`1 234 kr`).
- **Deliverables:** live Vercel URL (pending deployment) + GitHub repo — **https://github.com/anhvvh/OpsHub** — with a README (problem, approach, screenshots, stack), a case-study write-up of the PM/BA/UX/architecture thinking, and a short demo video/GIF.

## Testing Decisions

Both seams below are built, with every expected value in the tests derived from this PRD's own text (worked examples, stated caps, stated word limits) rather than from reading the implementation — so a failing test means the code disagrees with the spec, not the reverse. 36 tests, `npm test`, all passing.

**Primary testing seam — the insight rule engine** (`tests/insights-rules.test.ts`, 24 tests). The five rule functions are pure (dataset in → fired insights out), which makes them the highest-value, cheapest-to-test seam in the app. Tests feed constructed datasets and assert on external behavior only (which insights fire, with what severity and values) — never on internals.

- Each of the five rules gets: a firing case (anchored to this PRD's own worked examples — e.g. the Lavender Face Serum low-stock scenario, the Vitamin C 3× hot-seller scenario), a non-firing case, and a boundary case where PRD.md states one (exactly at the low-stock threshold).
- Rate-of-change rules get a "no prior-period data" case (must not fire or divide by zero) — required by this section before any code existed, and every rule respects it.
- Two of the five rules (`revenueDownRule`, `refundSpikeRule`) had a genuine bug this testing caught: comparing a raw floating-point ratio against a threshold before rounding silently missed a true 10%/40% change (see §Implementation Decisions). Both are fixed.
- **Known gap, not a test:** PRD.md gives worked-example *magnitudes* (≈20% revenue decline, ≈3× hot seller, ≈40% refund spike) but does not state the exact numeric thresholds that trigger each rule, or a minimum-volume noise floor for the two rate-of-change rules that have one in code (`hotSellerRule`, `refundSpikeRule`). No boundary test was written for these — inventing a threshold to test against would test the test's own invention, not the spec. These numbers should be confirmed and written into this PRD.

**Secondary seam — the two write paths** (`tests/order-status-action.test.ts` + `tests/stock-adjustment-action.test.ts`, 12 tests), implemented as Next.js Server Actions and tested against the **real dev Supabase database** — not a separate isolated test database — using uniquely `TEST-`-prefixed fixture rows created before each test and deleted after, so runs never touch the seeded demo data. Chosen over a mocked Prisma client (weaker: would assert on internal calls, not persistence) and over an ephemeral Supabase branch (real cost/setup disproportionate to a portfolio MVP).

- `updateOrderStatus`: a legal transition persists and appends the correct `OrderEvent`; an illegal transition (including a terminal state, and setting a status to itself) is rejected and leaves the row and timeline untouched; an unknown order id is rejected without throwing.
- `adjustStock`: a valid new quantity persists and is immediately readable as over/under threshold in the same request cycle; zero is valid (sold out is not an error); a negative or non-integer quantity is rejected with the row unchanged; an unknown product id is rejected without throwing.

**Not automated:** visual polish, LLM output phrasing (non-deterministic; covered by the template-text fallback), and page rendering beyond a smoke check. A manual demo checklist covers the reviewer journey instead: open dashboard → see 5 insights → click each through to its detail screen → update one order status → adjust one stock count → watch the low-stock insight disappear.

*Prior art: `tests/insights-rules.test.ts` (24 tests) is the first seam and sets the convention — pure functions, PRD-derived expected values, no mocking. `tests/order-status-action.test.ts` and `tests/stock-adjustment-action.test.ts` (12 tests) extend it to the write path.*

## Out of Scope

- Live integrations with any real platform (Shopify, Stripe, Klarna, Amazon, Zalando APIs)
- Authentication, user accounts, roles/permissions, multi-merchant switching
- Chatbot / conversational UI for the AI Assistant
- Full-text order search, bulk actions, multi-channel order merging
- Multi-warehouse or cross-channel stock sync; lot/batch/serial tracking; demand forecasting
- Dispute handling, bank reconciliation, payout scheduling, accounting/bookkeeping features
- Customer service / helpdesk features; shipping label generation
- Notifications outside the app (email, SMS, Slack)
- Mobile-native apps (the web app should be responsive, but desktop is the demo target)

## Further Notes

- **Scope discipline:** research.md's core lesson is that every competitor's failure mode is depth and clutter. When in doubt during the build, cut features and add polish — the dashboard and AI Insights panel are the centerpiece; Orders/Inventory/Payments exist to make the cockpit feel real and to receive the deep links.
- **Seed data is a first-class product artifact.** The demo's credibility depends on the data telling a coherent story (a real-feeling month for Hälsa Skincare with five discoverable problems). Budget real time for it.
- **Publishing note:** this spec would normally be filed to the project issue tracker with a `ready-for-agent` label; the repo has no tracker set up, so it lives as `PRD.md` in the project root. Git is initialized and the repo is live at [github.com/anhvvh/OpsHub](https://github.com/anhvvh/OpsHub).
- **Tooling gotchas fixed while building the test suite:** the generated Prisma Client had never been regenerated after the schema moved from SQLite to Postgres, so it was silently still targeting SQLite — `npx prisma generate` must be re-run after any `schema.prisma` change, not just after `prisma migrate`/`db push`. Separately, plain `tsx` (unlike the `prisma` CLI) does not load `.env` on its own; `package.json`'s `test`/`db:seed` scripts now pass Node's `--env-file=.env` explicitly. Anyone cloning the repo fresh should run `npx prisma generate` before `npm test` or `npm run db:seed`.
