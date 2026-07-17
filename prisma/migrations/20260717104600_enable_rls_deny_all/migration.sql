-- OpsHub security posture: deny-by-default.
--
-- OpsHub reaches Postgres only through Prisma, using the owner role over a
-- direct connection string. Nothing in the app uses supabase-js, so the
-- public PostgREST API (reachable with the anon/publishable key) is not a
-- needed surface — it is pure attack surface. We therefore close it.
--
-- Layer 1: enable RLS with NO policies. With RLS on and no policy granting
-- access, the anon and authenticated roles match zero rows on every table.
-- Deliberately NOT using FORCE ROW LEVEL SECURITY: table owners bypass RLS
-- by design, which is what keeps Prisma working.
--
-- Layer 2: revoke table privileges from the public API roles outright, so
-- the tables are not even reachable through PostgREST.
--
-- NOTE: the service_role key bypasses RLS entirely by design. That is
-- precisely why OpsHub does not store it anywhere. Only DATABASE_URL is kept.
--
-- If OpsHub ever becomes multi-tenant with real logins, this is where
-- tenant-scoped policies would go, e.g.:
--   CREATE POLICY tenant_isolation ON "Order" FOR SELECT TO authenticated
--     USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
-- That requires an authenticated identity to key on, which the current
-- single-merchant MVP intentionally does not have. See README.

ALTER TABLE "Product"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderEvent" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "Product"    FROM anon, authenticated;
REVOKE ALL ON TABLE "Order"      FROM anon, authenticated;
REVOKE ALL ON TABLE "OrderItem"  FROM anon, authenticated;
REVOKE ALL ON TABLE "Payment"    FROM anon, authenticated;
REVOKE ALL ON TABLE "OrderEvent" FROM anon, authenticated;
