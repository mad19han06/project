/*
# Security hardening

## Issues fixed
1. Function `public.handle_new_user` had a role-mutable search_path.
   -> Pin `search_path = public` on the function.
2. RLS policy `logs_insert_auth` on `public.activity_logs` allowed any
   authenticated user to insert any row (WITH CHECK always true).
   -> Restrict to rows where `user_id = auth.uid()` so users can only
   log their own actions.
3. Public buckets (`avatars`, `deliverables`, `payment-screenshots`,
   `project-images`, `qr-codes`, `requirements`, `resumes`) had broad
   SELECT policies on `storage.objects` that allowed listing all files.
   Public buckets serve objects via their public URL without a SELECT
   policy, so these policies only expose the file list. Drop them.
4. `public.handle_new_user()` and `public.is_admin()` were executable by
   `anon` (and `authenticated` for `handle_new_user`) via RPC.
   - `handle_new_user` is a trigger function; it does not need EXECUTE
     from any role. Revoke from PUBLIC.
   - `is_admin` is referenced by RLS policies scoped to `authenticated`,
     so authenticated must retain EXECUTE. Revoke from `anon` only.
*/

-- 1. Pin search_path on handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'role', 'student'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Restrict activity_logs INSERT to own rows
DROP POLICY IF EXISTS "logs_insert_auth" ON activity_logs;
CREATE POLICY "logs_insert_auth" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- 3. Drop broad SELECT policies on public buckets (they enable listing)
DROP POLICY IF EXISTS "avatars_read" ON storage.objects;
DROP POLICY IF EXISTS "resumes_read" ON storage.objects;
DROP POLICY IF EXISTS "payscr_read" ON storage.objects;
DROP POLICY IF EXISTS "deliv_read" ON storage.objects;
DROP POLICY IF EXISTS "qr_read" ON storage.objects;
DROP POLICY IF EXISTS "req_read" ON storage.objects;
DROP POLICY IF EXISTS "projimg_read" ON storage.objects;

-- 4. Revoke EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;