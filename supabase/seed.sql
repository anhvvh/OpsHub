-- OpsHub — sample data (PRD.md §Sample Data), safe to run more than once.
--
-- Idempotency strategy:
--   Product   — natural key is sku;         "insert ... on conflict (sku) do nothing"
--   Payment   — natural key is paymentNumber; "insert ... on conflict ("paymentNumber") do nothing"
--   Order     — natural key is orderNumber;  "insert ... on conflict ("orderNumber") do nothing ... returning id"
--   OrderItem / OrderEvent have no natural business key of their own (an
--   order can legitimately log two identical-looking events at different
--   times), so instead of inventing an artificial unique constraint for
--   them, each order's items/events are inserted via a CTE chained off that
--   order's own "returning id" — on a re-run the Order insert returns zero
--   rows (already exists), so the chained item/event inserts also insert
--   zero rows. No row is ever duplicated on replay.
--
-- Timestamps are relative to now() (today / yesterday / two days ago),
-- matching prisma/seed.ts's own anchor, so the "Morning Briefing" always
-- reads as recent activity regardless of when this file is run.
--
-- This is the small, fast, hand-picked dataset for "see it immediately" —
-- 12 products, 9 orders. It deliberately mirrors src/lib/mock.ts (the UI's
-- current fixture data) so the real database tells the same story once the
-- screens are repointed at it. For a fuller, larger randomized dataset
-- (~300-500 orders across 30 days), run `npm run db:seed` instead
-- (prisma/seed.ts) — the two are complementary, not both needed at once.

-- --------------------------------------------------------------- Products
insert into "Product" ("id", "sku", "name", "category", "priceOre", "promoPriceOre", "stockQuantity", "lowStockThreshold", "updatedAt")
values
  (gen_random_uuid()::text, 'HAL-SER-LAV',  'Lavender Face Serum',          'Serums',    54900, 46900,  4, 15, now()),
  (gen_random_uuid()::text, 'HAL-CLN-ROS',  'Rosehip Cleansing Oil',        'Cleansers', 39900, 33900,  9, 12, now()),
  (gen_random_uuid()::text, 'HAL-BLM-SEA',  'Sea Buckthorn Balm',           'Balms',     45900, 38900, 11, 15, now()),
  (gen_random_uuid()::text, 'HAL-SER-VITC', 'Vitamin C Brightening Serum',  'Serums',    69900, 59900, 58, 20, now()),
  (gen_random_uuid()::text, 'HAL-CRM-CHA',  'Chamomile Day Cream',          'Creams',    42900, 36900, 42, 15, now()),
  (gen_random_uuid()::text, 'HAL-CRM-ROS',  'Rosehip Night Cream',          'Creams',    47900, 40900, 63, 15, now()),
  (gen_random_uuid()::text, 'HAL-CLN-GEN',  'Gentle Foaming Cleanser',      'Cleansers', 24900, 20900, 88, 20, now()),
  (gen_random_uuid()::text, 'HAL-BND-GLW',  'Nordic Glow Bundle',           'Bundles',   89900, 74900, 24, 10, now()),
  (gen_random_uuid()::text, 'HAL-TON-BIR',  'Birch Sap Toner',              'Toners',    27900, null,   51, 15, now()),
  (gen_random_uuid()::text, 'HAL-EYE-CLB',  'Cloudberry Eye Cream',         'Creams',    38900, null,   33, 12, now()),
  (gen_random_uuid()::text, 'HAL-MSK-OAT',  'Oat Milk Recovery Mask',       'Masks',     32900, null,   47, 15, now()),
  (gen_random_uuid()::text, 'HAL-OIL-MID',  'Midnight Sun Face Oil',        'Oils',      51900, null,   29, 12, now())
on conflict ("sku") do nothing;

-- ------------------------------------------------------------------------
-- Orders. Each block: insert the order (skipped if orderNumber exists),
-- then — only for a newly-inserted order — its items, payment, and
-- timeline. Day 0 = today, day -1 = yesterday, day -2 = two days ago,
-- matching src/lib/mock.ts's "14 Jul / 13 Jul / 12 Jul" labels.

-- OH-1087 — pending payment (today)
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1087', 'Elin Sundqvist', 'elin.sundqvist@epost.se',
          E'Vasagatan 8\n111 20 Stockholm, Sweden', 'SHOPIFY', 'PENDING_PAYMENT', 124000,
          current_date + time '08:12', current_date + time '08:12')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", v.qty, v.amount
from new_order
join (values ('HAL-SER-VITC', 1, 59900), ('HAL-BND-GLW', 1, 64100)) as v(sku, qty, amount) on true
join "Product" p on p."sku" = v.sku;

with new_order as (select "id" from "Order" where "orderNumber" = 'OH-1087')
insert into "Payment" ("id", "paymentNumber", "orderId", "provider", "status", "amountOre", "createdAt", "updatedAt")
select gen_random_uuid()::text, 'PMT-4471', new_order.id, 'KLARNA', 'PENDING', 124000, current_date + time '08:12', current_date + time '08:12'
from new_order
on conflict ("paymentNumber") do nothing;

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description, current_date + e.at::time
from "Order" o
join (values ('ORDER_PLACED', 'Order placed', '08:12')) as e(type, description, at) on true
where o."orderNumber" = 'OH-1087'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);

-- OH-1086 — paid (today)
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1086', 'Johan Berg', 'johan.berg@epost.se',
          E'Kungsgatan 22\n411 19 Göteborg, Sweden', 'AMAZON', 'PAID', 68500,
          current_date + time '07:02', current_date + time '07:03')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", 1, 68500
from new_order join "Product" p on p."sku" = 'HAL-CRM-CHA';

with new_order as (select "id" from "Order" where "orderNumber" = 'OH-1086')
insert into "Payment" ("id", "paymentNumber", "orderId", "provider", "status", "amountOre", "createdAt", "updatedAt")
select gen_random_uuid()::text, 'PMT-4470', new_order.id, 'STRIPE', 'SUCCEEDED', 68500, current_date + time '07:03', current_date + time '07:03'
from new_order
on conflict ("paymentNumber") do nothing;

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description, current_date + e.at::time
from "Order" o
join (values
  ('ORDER_PLACED', 'Order placed', '07:02'),
  ('PAYMENT_RECEIVED', 'Payment received — Stripe', '07:03')
) as e(type, description, at) on true
where o."orderNumber" = 'OH-1086'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);

-- OH-1085 — paid (today)
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1085', 'Astrid Lindqvist', 'astrid.lindqvist@epost.se',
          E'Sveavägen 41\n113 59 Stockholm, Sweden', 'SHOPIFY', 'PAID', 213000,
          current_date + time '06:31', current_date + time '06:32')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", v.qty, v.amount
from new_order
join (values ('HAL-BND-GLW', 2, 149800), ('HAL-BLM-SEA', 1, 63200)) as v(sku, qty, amount) on true
join "Product" p on p."sku" = v.sku;

with new_order as (select "id" from "Order" where "orderNumber" = 'OH-1085')
insert into "Payment" ("id", "paymentNumber", "orderId", "provider", "status", "amountOre", "createdAt", "updatedAt")
select gen_random_uuid()::text, 'PMT-4469', new_order.id, 'STRIPE', 'SUCCEEDED', 213000, current_date + time '06:32', current_date + time '06:32'
from new_order
on conflict ("paymentNumber") do nothing;

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description, current_date + e.at::time
from "Order" o
join (values
  ('ORDER_PLACED', 'Order placed', '06:31'),
  ('PAYMENT_RECEIVED', 'Payment received — Stripe', '06:32')
) as e(type, description, at) on true
where o."orderNumber" = 'OH-1085'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);

-- OH-1084 — fulfilled (yesterday)
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1084', 'Karin Ohlsson', 'karin.ohlsson@epost.se',
          E'Drottninggatan 5\n252 21 Helsingborg, Sweden', 'SHOPIFY', 'FULFILLED', 44900,
          (current_date - 1) + time '11:20', (current_date - 1) + time '17:40')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", 2, 44900
from new_order join "Product" p on p."sku" = 'HAL-CLN-GEN';

with new_order as (select "id" from "Order" where "orderNumber" = 'OH-1084')
insert into "Payment" ("id", "paymentNumber", "orderId", "provider", "status", "amountOre", "createdAt", "updatedAt")
select gen_random_uuid()::text, 'PMT-4468', new_order.id, 'KLARNA', 'SUCCEEDED', 44900, (current_date - 1) + time '11:22', (current_date - 1) + time '11:22'
from new_order
on conflict ("paymentNumber") do nothing;

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description, (current_date - 1) + e.at::time
from "Order" o
join (values
  ('ORDER_PLACED', 'Order placed', '11:20'),
  ('PAYMENT_RECEIVED', 'Payment received — Klarna', '11:22'),
  ('FULFILLED', 'Fulfilled — shipped via PostNord', '17:40')
) as e(type, description, at) on true
where o."orderNumber" = 'OH-1084'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);

-- OH-1083 — fulfilled, but payment failed (yesterday) — a failed-payment scenario
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1083', 'Lars Nyström', 'lars.nystrom@epost.se',
          E'Storgatan 3\n903 21 Umeå, Sweden', 'AMAZON', 'FULFILLED', 89900,
          (current_date - 1) + time '09:05', (current_date - 1) + time '15:12')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", 1, 89900
from new_order join "Product" p on p."sku" = 'HAL-BND-GLW';

with new_order as (select "id" from "Order" where "orderNumber" = 'OH-1083')
insert into "Payment" ("id", "paymentNumber", "orderId", "provider", "status", "amountOre", "failureReason", "createdAt", "updatedAt")
select gen_random_uuid()::text, 'PMT-4467', new_order.id, 'STRIPE', 'FAILED', 89900, 'card_declined', (current_date - 1) + time '09:06', (current_date - 1) + time '09:06'
from new_order
on conflict ("paymentNumber") do nothing;

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description, (current_date - 1) + e.at::time
from "Order" o
join (values
  ('ORDER_PLACED', 'Order placed', '09:05'),
  ('PAYMENT_FAILED', 'Payment failed — card declined', '09:06'),
  ('FULFILLED', 'Fulfilled — shipped via PostNord', '15:12')
) as e(type, description, at) on true
where o."orderNumber" = 'OH-1083'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);

-- OH-1082 — delivered (placed 2 days ago, delivered yesterday)
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1082', 'Sofia Ekström', 'sofia.ekstrom@epost.se',
          E'Storgatan 14\n114 51 Stockholm, Sweden', 'SHOPIFY', 'DELIVERED', 159800,
          (current_date - 2) + time '09:38', (current_date - 1) + time '14:22')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", v.qty, v.amount
from new_order
join (values ('HAL-CLN-ROS', 1, 39900), ('HAL-SER-VITC', 1, 69900), ('HAL-BLM-SEA', 1, 50000)) as v(sku, qty, amount) on true
join "Product" p on p."sku" = v.sku;

with new_order as (select "id" from "Order" where "orderNumber" = 'OH-1082')
insert into "Payment" ("id", "paymentNumber", "orderId", "provider", "status", "amountOre", "createdAt", "updatedAt")
select gen_random_uuid()::text, 'PMT-4466', new_order.id, 'STRIPE', 'SUCCEEDED', 159800, (current_date - 2) + time '09:41', (current_date - 2) + time '09:41'
from new_order
on conflict ("paymentNumber") do nothing;

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description,
       case e.day_offset when -2 then (current_date - 2) + e.at::time else (current_date - 1) + e.at::time end
from "Order" o
join (values
  ('ORDER_PLACED', 'Order placed', '09:38', -2),
  ('PAYMENT_RECEIVED', 'Payment received — Stripe', '09:41', -2),
  ('FULFILLED', 'Fulfilled — shipped via PostNord', '16:05', -2),
  ('DELIVERED', 'Delivered', '14:22', -1)
) as e(type, description, at, day_offset) on true
where o."orderNumber" = 'OH-1082'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);

-- OH-1081 — delivered (placed 2 days ago, delivered yesterday)
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1081', 'Erik Wallin', 'erik.wallin@epost.se',
          E'Nygatan 12\n753 20 Uppsala, Sweden', 'SHOPIFY', 'DELIVERED', 32900,
          (current_date - 2) + time '08:14', (current_date - 1) + time '10:47')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", 1, 32900
from new_order join "Product" p on p."sku" = 'HAL-CLN-GEN';

with new_order as (select "id" from "Order" where "orderNumber" = 'OH-1081')
insert into "Payment" ("id", "paymentNumber", "orderId", "provider", "status", "amountOre", "failureReason", "createdAt", "updatedAt")
select gen_random_uuid()::text, 'PMT-4465', new_order.id, 'STRIPE', 'FAILED', 32900, 'insufficient_funds', (current_date - 2) + time '08:15', (current_date - 2) + time '08:15'
from new_order
on conflict ("paymentNumber") do nothing;

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description,
       case e.day_offset when -2 then (current_date - 2) + e.at::time else (current_date - 1) + e.at::time end
from "Order" o
join (values
  ('ORDER_PLACED', 'Order placed', '08:14', -2),
  ('PAYMENT_RECEIVED', 'Payment received — Stripe', '08:15', -2),
  ('FULFILLED', 'Fulfilled — shipped via PostNord', '14:02', -2),
  ('DELIVERED', 'Delivered', '10:47', -1)
) as e(type, description, at, day_offset) on true
where o."orderNumber" = 'OH-1081'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);

-- OH-1080 — refunded (placed 2 days ago, refunded yesterday) — the refund-spike scenario
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1080', 'Maja Holm', 'maja.holm@epost.se',
          E'Ringvägen 60\n118 67 Stockholm, Sweden', 'AMAZON', 'REFUNDED', 75600,
          (current_date - 2) + time '07:44', (current_date - 1) + time '12:30')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", 2, 75600
from new_order join "Product" p on p."sku" = 'HAL-CRM-ROS';

with new_order as (select "id" from "Order" where "orderNumber" = 'OH-1080')
insert into "Payment" ("id", "paymentNumber", "orderId", "provider", "status", "amountOre", "createdAt", "updatedAt")
select gen_random_uuid()::text, 'PMT-4464', new_order.id, 'KLARNA', 'REFUNDED', 75600, (current_date - 2) + time '07:45', (current_date - 1) + time '12:30'
from new_order
on conflict ("paymentNumber") do nothing;

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description,
       case e.day_offset when -2 then (current_date - 2) + e.at::time else (current_date - 1) + e.at::time end
from "Order" o
join (values
  ('ORDER_PLACED', 'Order placed', '07:44', -2),
  ('PAYMENT_RECEIVED', 'Payment received — Klarna', '07:45', -2),
  ('REFUNDED', 'Refunded — customer refund', '12:30', -1)
) as e(type, description, at, day_offset) on true
where o."orderNumber" = 'OH-1080'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);

-- OH-1079 — cancelled (2 days ago)
with new_order as (
  insert into "Order" ("id", "orderNumber", "customerName", "customerEmail", "shippingAddress", "channel", "status", "totalOre", "createdAt", "updatedAt")
  values (gen_random_uuid()::text, 'OH-1079', 'Nils Franzén', 'nils.franzen@epost.se',
          E'Hamngatan 2\n211 22 Malmö, Sweden', 'SHOPIFY', 'CANCELLED', 54000,
          (current_date - 2) + time '06:10', (current_date - 2) + time '09:55')
  on conflict ("orderNumber") do nothing
  returning id
)
insert into "OrderItem" ("id", "orderId", "productId", "quantity", "unitPriceOre")
select gen_random_uuid()::text, new_order.id, p."id", 1, 54000
from new_order join "Product" p on p."sku" = 'HAL-CRM-CHA';

insert into "OrderEvent" ("id", "orderId", "type", "description", "createdAt")
select gen_random_uuid()::text, o."id", e.type, e.description, (current_date - 2) + e.at::time
from "Order" o
join (values
  ('ORDER_PLACED', 'Order placed', '06:10'),
  ('CANCELLED', 'Cancelled — customer request', '09:55')
) as e(type, description, at) on true
where o."orderNumber" = 'OH-1079'
  and not exists (select 1 from "OrderEvent" ev where ev."orderId" = o."id" and ev."type" = e.type);
