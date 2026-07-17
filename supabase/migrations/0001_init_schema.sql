-- OpsHub — initial schema (PRD.md §Database Model).
--
-- Idempotent (CREATE TABLE IF NOT EXISTS): this project's tables already
-- exist, created in an earlier session via prisma/migrations/. This file
-- formalizes that same schema as a versioned Supabase migration so a fresh
-- project can be bootstrapped from `supabase/migrations/` alone, without
-- ever hand-editing the Dashboard.
--
-- Column names are camelCase, double-quoted, to match exactly what Prisma
-- (the app's ORM — see prisma/schema.prisma) expects on the wire. Money is
-- integer öre (SEK minor units), never floating point.
--
-- Lifecycle fields (channel, status, provider, type) are PLAIN TEXT, not
-- native Postgres ENUMs — this is a deliberate PRD decision (see
-- prisma/schema.prisma's own header comment): the allowed values are
-- validated in the app layer (src/lib/domain.ts), so adding a new status
-- later never requires a schema migration. Do not add a CHECK constraint
-- enumerating these values — that would silently reintroduce the exact
-- migration-on-every-new-status friction this design avoids.

create table if not exists "Product" (
  "id"                text primary key,
  "sku"               text not null unique,
  "name"              text not null,
  "category"          text not null,
  "description"       text,
  "priceOre"          integer not null,           -- original price, in öre
  "promoPriceOre"     integer,                     -- current promotional price, if on promo
  "stockQuantity"     integer not null,
  "lowStockThreshold" integer not null default 10,
  "createdAt"         timestamp not null default current_timestamp,
  "updatedAt"         timestamp not null
);

create table if not exists "Order" (
  "id"              text primary key,
  "orderNumber"     text not null unique,          -- e.g. "OH-1042"
  "customerName"    text not null,
  "customerEmail"   text not null,
  "shippingAddress" text not null,
  "channel"         text not null,                 -- SHOPIFY | AMAZON (validated in src/lib/domain.ts)
  "status"          text not null,                 -- Shopify-style lifecycle (validated in src/lib/domain.ts)
  "totalOre"        integer not null,
  "createdAt"       timestamp not null default current_timestamp,
  "updatedAt"        timestamp not null
);

create table if not exists "OrderItem" (
  "id"           text primary key,
  "orderId"      text not null references "Order" ("id"),
  "productId"    text not null references "Product" ("id"),
  "quantity"     integer not null,
  "unitPriceOre" integer not null                  -- price at time of sale
);

create table if not exists "Payment" (
  "id"            text primary key,
  "paymentNumber" text not null unique,             -- e.g. "PMT-4471"
  "orderId"       text not null unique references "Order" ("id"),
  "provider"      text not null,                    -- STRIPE | KLARNA (validated in src/lib/domain.ts)
  "status"        text not null,                    -- PENDING | SUCCEEDED | FAILED | REFUNDED (validated in src/lib/domain.ts)
  "amountOre"     integer not null,
  "failureReason" text,
  "createdAt"     timestamp not null default current_timestamp,
  "updatedAt"     timestamp not null
);

create table if not exists "OrderEvent" (
  "id"          text primary key,
  "orderId"     text not null references "Order" ("id"),
  "type"        text not null,                      -- ORDER_PLACED | PAYMENT_RECEIVED | PAYMENT_FAILED | FULFILLED | DELIVERED | STATUS_CHANGED | REFUNDED | CANCELLED
  "description" text not null,
  "createdAt"   timestamp not null default current_timestamp
);
