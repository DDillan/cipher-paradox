-- =====================================================================
-- CIPHER — add GitHub link support to leadership members
-- Run this ONCE in the Supabase dashboard: SQL Editor -> New query -> Run
-- Safe to run even if the column already exists.
-- =====================================================================

alter table public.leadership
  add column if not exists github_url text;
