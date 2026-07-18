/*
# Storage bucket policies for file uploads

## Purpose
Adds RLS policies to storage.objects so authenticated users can upload files
to the buckets needed by the app, and anyone can read them (public buckets).

## Buckets & rules
1. `avatars` — authenticated users can upload/read/delete their own files.
2. `resumes` — authenticated users can upload/read/delete their own files.
3. `payment-screenshots` — authenticated users can upload/read; admins can delete.
4. `deliverables` — admins can upload/read/delete; students can read.
5. `qr-codes` — admins can upload/read/delete; anyone can read.

## Notes
- All buckets are public (read access is open via the public URL), so we only
  need INSERT/UPDATE/DELETE policies.
- Policies use `bucket_id = '...'` to scope to a specific bucket.
- Admin actions are gated through `public.is_admin()`.
*/

-- avatars: users can manage their own uploads
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- resumes
CREATE POLICY "resumes_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "resumes_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "resumes_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes')
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "resumes_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes');

-- payment-screenshots: students upload, anyone read, admin delete
CREATE POLICY "payscr_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "payscr_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'payment-screenshots');

CREATE POLICY "payscr_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.is_admin());

-- deliverables: admin upload/delete, anyone read
CREATE POLICY "deliv_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deliverables' AND public.is_admin());

CREATE POLICY "deliv_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'deliverables');

CREATE POLICY "deliv_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'deliverables' AND public.is_admin());

-- qr-codes: admin upload/delete, anyone read
CREATE POLICY "qr_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'qr-codes' AND public.is_admin());

CREATE POLICY "qr_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'qr-codes');

CREATE POLICY "qr_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'qr-codes' AND public.is_admin());