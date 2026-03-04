-- ============================================================
-- Migration: 0005_revoke_postgrest
-- Revokes PostgREST (Supabase auto-REST API) access from the
-- anon and authenticated roles.
--
-- Why: Even with RLS enabled (0004_enable_rls), PostgREST can
-- still introspect the schema and return empty arrays instead of
-- a proper access-denied error. Revoking table grants and schema
-- USAGE produces HTTP 403 responses and eliminates schema leakage.
--
-- The Node.js API uses the "postgres" role, which is unaffected
-- by these REVOKE statements.
-- ============================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE USAGE ON SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM authenticated;
