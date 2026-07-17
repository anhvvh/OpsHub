-- OpsHub — business-rule constraints and query indexes.
--
-- Postgres has no native "ADD CONSTRAINT IF NOT EXISTS", so each CHECK is
-- wrapped in a guarded DO block (idempotent: re-running this file is a
-- no-op once applied). Indexes use CREATE INDEX IF NOT EXISTS, which is
-- natively idempotent.
--
-- Scope note: these are structural sanity rules (non-negative money/
-- quantities, non-empty codes), not value-enumeration checks — see
-- 0001_init_schema.sql's header for why status/channel/provider/type stay
-- unconstrained TEXT.

-- ---------------------------------------------------------------- Product
do $$ begin
  alter table "Product" add constraint "product_price_non_negative"
    check ("priceOre" >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Product" add constraint "product_promo_price_non_negative"
    check ("promoPriceOre" is null or "promoPriceOre" >= 0);
exception when duplicate_object then null; end $$;

-- A promotional price is a discount, never a markup (every worked example
-- in PRD.md §Sample Data has promoPriceOre < priceOre). Judgment call, not
-- a rule PRD.md states in so many words — flagged for confirmation.
do $$ begin
  alter table "Product" add constraint "product_promo_price_is_discount"
    check ("promoPriceOre" is null or "promoPriceOre" <= "priceOre");
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Product" add constraint "product_stock_non_negative"
    check ("stockQuantity" >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Product" add constraint "product_threshold_non_negative"
    check ("lowStockThreshold" >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Product" add constraint "product_sku_not_blank"
    check (length(trim("sku")) > 0);
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------ Order
do $$ begin
  alter table "Order" add constraint "order_total_non_negative"
    check ("totalOre" >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Order" add constraint "order_number_not_blank"
    check (length(trim("orderNumber")) > 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Order" add constraint "order_status_not_blank"
    check (length(trim("status")) > 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Order" add constraint "order_channel_not_blank"
    check (length(trim("channel")) > 0);
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------- OrderItem
do $$ begin
  alter table "OrderItem" add constraint "order_item_quantity_positive"
    check ("quantity" > 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "OrderItem" add constraint "order_item_price_non_negative"
    check ("unitPriceOre" >= 0);
exception when duplicate_object then null; end $$;

-- One row per product per order — a repeat purchase within the same order
-- increases quantity on the existing row rather than adding a duplicate.
do $$ begin
  alter table "OrderItem" add constraint "order_item_unique_product_per_order"
    unique ("orderId", "productId");
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- Payment
do $$ begin
  alter table "Payment" add constraint "payment_amount_non_negative"
    check ("amountOre" >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Payment" add constraint "payment_number_not_blank"
    check (length(trim("paymentNumber")) > 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Payment" add constraint "payment_status_not_blank"
    check (length(trim("status")) > 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table "Payment" add constraint "payment_provider_not_blank"
    check (length(trim("provider")) > 0);
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------- OrderEvent
do $$ begin
  alter table "OrderEvent" add constraint "order_event_type_not_blank"
    check (length(trim("type")) > 0);
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------------- Indexes
-- Foreign-key columns: unindexed FKs make every join and cascade a seq scan.
create index if not exists "order_item_order_id_idx"   on "OrderItem" ("orderId");
create index if not exists "order_item_product_id_idx" on "OrderItem" ("productId");
create index if not exists "order_event_order_id_idx"  on "OrderEvent" ("orderId");
-- Payment.orderId already has a unique index (Payment_orderId_key) from 0001.

-- Hot filter/sort columns driven directly by the app's own query patterns:
-- Orders/Payments list screens filter by status; the dashboard and the
-- insight rule engine's revenue/refund/hot-seller rules all window on the
-- last 7 vs. prior 7 days (src/lib/insights/gather.ts).
create index if not exists "order_status_idx"     on "Order" ("status");
create index if not exists "order_created_at_idx" on "Order" ("createdAt");
create index if not exists "payment_status_idx"    on "Payment" ("status");
create index if not exists "payment_created_at_idx" on "Payment" ("createdAt");

-- Low-stock evaluation (stockQuantity < lowStockThreshold) runs on every
-- dashboard load; a plain index on stockQuantity supports the comparison.
create index if not exists "product_stock_quantity_idx" on "Product" ("stockQuantity");
