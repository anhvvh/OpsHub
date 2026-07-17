-- OpsHub — close the one gap in the deny-by-default posture (PRD.md
-- §Database Model, "Security"): Prisma's own bookkeeping table,
-- "_prisma_migrations", is created by the Prisma CLI itself and was never
-- covered by 0003_enable_rls.sql's lock-down of the five app tables.
--
-- Supabase's security advisor flags it directly: RLS disabled + full
-- anon/authenticated grants means anyone holding the publishable (anon) key
-- could read or tamper with migration history via the public PostgREST API.
-- It holds no customer data, but the same "public API is pure attack
-- surface, close it" reasoning from 0003 applies here too.
--
-- Idempotent: ENABLE ROW LEVEL SECURITY and REVOKE are both safe to re-run.

alter table "_prisma_migrations" enable row level security;

revoke all on table "_prisma_migrations" from anon, authenticated;
