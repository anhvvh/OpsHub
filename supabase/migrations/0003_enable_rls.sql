-- OpsHub — deny-by-default security posture (PRD.md §Database Model, "Security").
--
-- The app reaches Postgres only through Prisma over a direct connection
-- string, connecting as the table owner (which bypasses RLS by design).
-- Nothing in the app uses supabase-js, so the public PostgREST API is not a
-- needed surface for OpsHub — it is pure attack surface. This migration
-- closes it: RLS is enabled with NO policies, and the anon/authenticated
-- roles are revoked outright, so the public API grants zero access even if
-- the publishable key ends up in client-side code.
--
-- Idempotent: ENABLE ROW LEVEL SECURITY and REVOKE are both safe to re-run.
--
-- If OpsHub ever needs real multi-tenant access via the public API, this is
-- where tenant-scoped policies would go, e.g.:
--   create policy tenant_isolation on "Order" for select to authenticated
--     using (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
-- That requires an authenticated identity to key on, which the current
-- single-merchant MVP intentionally does not have.

alter table "Product"    enable row level security;
alter table "Order"      enable row level security;
alter table "OrderItem"  enable row level security;
alter table "Payment"    enable row level security;
alter table "OrderEvent" enable row level security;

revoke all on table "Product"    from anon, authenticated;
revoke all on table "Order"      from anon, authenticated;
revoke all on table "OrderItem"  from anon, authenticated;
revoke all on table "Payment"    from anon, authenticated;
revoke all on table "OrderEvent" from anon, authenticated;
