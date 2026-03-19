-- ============================================================
-- 00001_rls_policies.sql
-- Supabase Row-Level Security policies for InwitClipps
--
-- Run once via:  psql $DATABASE_URL -f supabase/migrations/00001_rls_policies.sql
-- Or paste into  Supabase Dashboard → SQL Editor → New Query
--
-- Design principles:
--   • jobs   — users see/mutate only their own rows  (user_id = auth.uid())
--   • clips  — users see/mutate clips whose parent job they own
--   • trends — read-only for every authenticated user (public reference data)
--
-- The service_role key (used by backend workers) bypasses RLS entirely,
-- so background workers can write to any table without extra policies.
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  Helper: updated_at auto-touch trigger                   │
-- └──────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply the trigger to jobs and clips
DROP TRIGGER IF EXISTS trg_jobs_updated_at ON public.jobs;
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_clips_updated_at ON public.clips;
CREATE TRIGGER trg_clips_updated_at
  BEFORE UPDATE ON public.clips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 1. JOBS  — owner-only access
-- ============================================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own jobs
DROP POLICY IF EXISTS "jobs_select_own" ON public.jobs;
CREATE POLICY "jobs_select_own"
  ON public.jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create jobs for themselves only
DROP POLICY IF EXISTS "jobs_insert_own" ON public.jobs;
CREATE POLICY "jobs_insert_own"
  ON public.jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own jobs
DROP POLICY IF EXISTS "jobs_update_own" ON public.jobs;
CREATE POLICY "jobs_update_own"
  ON public.jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own jobs  (cascade will remove clips)
DROP POLICY IF EXISTS "jobs_delete_own" ON public.jobs;
CREATE POLICY "jobs_delete_own"
  ON public.jobs
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 2. CLIPS  — access scoped through the parent job's owner
-- ============================================================

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

-- Allow users to read clips for jobs they own
DROP POLICY IF EXISTS "clips_select_via_job" ON public.clips;
CREATE POLICY "clips_select_via_job"
  ON public.clips
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = clips.job_id
        AND jobs.user_id = auth.uid()
    )
  );

-- Allow users to insert clips for their own jobs
DROP POLICY IF EXISTS "clips_insert_via_job" ON public.clips;
CREATE POLICY "clips_insert_via_job"
  ON public.clips
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = clips.job_id
        AND jobs.user_id = auth.uid()
    )
  );

-- Allow users to update clips for their own jobs
DROP POLICY IF EXISTS "clips_update_via_job" ON public.clips;
CREATE POLICY "clips_update_via_job"
  ON public.clips
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = clips.job_id
        AND jobs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = clips.job_id
        AND jobs.user_id = auth.uid()
    )
  );

-- Allow users to delete clips for their own jobs
DROP POLICY IF EXISTS "clips_delete_via_job" ON public.clips;
CREATE POLICY "clips_delete_via_job"
  ON public.clips
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = clips.job_id
        AND jobs.user_id = auth.uid()
    )
  );


-- ============================================================
-- 3. TRENDS  — read-only for all authenticated users
--    Writes happen only from backend workers via service_role,
--    which bypasses RLS, so no INSERT/UPDATE/DELETE policies needed.
-- ============================================================

ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;

-- Any logged-in user can read trend data
DROP POLICY IF EXISTS "trends_select_authenticated" ON public.trends;
CREATE POLICY "trends_select_authenticated"
  ON public.trends
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- ============================================================
-- Done.  Verify with:
--   SELECT tablename, policyname, cmd
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- ============================================================
