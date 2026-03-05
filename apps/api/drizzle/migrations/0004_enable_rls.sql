-- ============================================================
-- Migration: 0004_enable_rls
-- Enables Row Level Security on all public tables.
--
-- Security model:
--   - The Node.js API connects as the "postgres" role, which is
--     the table owner and therefore BYPASSES RLS automatically.
--     No policies are needed for the API — it is unaffected.
--
--   - FORCE ROW LEVEL SECURITY is intentionally NOT used, because
--     it would affect the postgres (owner) role and break the API.
--
--   - With RLS enabled and no permissive policies defined, all
--     other roles (anon, authenticated, any direct DB connection
--     NOT using the postgres role) are denied ALL access.
--     This closes the Supabase PostgREST auto-API attack surface.
-- ============================================================

-- ─── Core user & tenant data ──────────────────────────────────────────────────
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_settings  ENABLE ROW LEVEL SECURITY;

-- ─── Per-project content ─────────────────────────────────────────────────────
ALTER TABLE public.knowledge         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits       ENABLE ROW LEVEL SECURITY;

-- ─── Platform-level data (super admin only) ───────────────────────────────────
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ─── Invitations (public accept flow goes via Node.js API, not PostgREST) ─────
ALTER TABLE public.invitations       ENABLE ROW LEVEL SECURITY;

-- ─── Explicit RESTRICTIVE deny-all for anon + authenticated ───────────────────
-- These are redundant (RLS with no permissive policy = deny-all already),
-- but serve as living documentation and act as a safety net: RESTRICTIVE
-- policies use AND logic, so they cannot be silently overridden by a future
-- permissive USING (true) policy without explicitly removing these first.

CREATE POLICY "deny_all_anon"          ON public.users            AS RESTRICTIVE TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON public.users            AS RESTRICTIVE TO authenticated  USING (false);

CREATE POLICY "deny_all_anon"          ON public.projects         AS RESTRICTIVE TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON public.projects         AS RESTRICTIVE TO authenticated  USING (false);

CREATE POLICY "deny_all_anon"          ON public.project_settings AS RESTRICTIVE TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON public.project_settings AS RESTRICTIVE TO authenticated  USING (false);

CREATE POLICY "deny_all_anon"          ON public.knowledge        AS RESTRICTIVE TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON public.knowledge        AS RESTRICTIVE TO authenticated  USING (false);

CREATE POLICY "deny_all_anon"          ON public.chat_logs        AS RESTRICTIVE TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON public.chat_logs        AS RESTRICTIVE TO authenticated  USING (false);

CREATE POLICY "deny_all_anon"          ON public.rate_limits      AS RESTRICTIVE TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON public.rate_limits      AS RESTRICTIVE TO authenticated  USING (false);

CREATE POLICY "deny_all_anon"          ON public.platform_settings AS RESTRICTIVE TO anon         USING (false);
CREATE POLICY "deny_all_authenticated" ON public.platform_settings AS RESTRICTIVE TO authenticated USING (false);

CREATE POLICY "deny_all_anon"          ON public.invitations      AS RESTRICTIVE TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON public.invitations      AS RESTRICTIVE TO authenticated  USING (false);
