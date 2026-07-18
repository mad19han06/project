/*
# Add `requirements` bucket for student-uploaded requirement documents

## Problem
The Catalog's "Submit Request" flow uploads optional supporting documents to
the `deliverables` bucket, but that bucket's INSERT storage policy requires
`is_admin()`. Students get a policy violation error when submitting a project
request with a supporting document.

## Fix
Create a dedicated `requirements` public bucket where authenticated students
can upload their requirement docs. Admins can read/delete; anyone can read.
*/

INSERT INTO storage.buckets (id, name, public) VALUES
  ('requirements', 'requirements', true)
ON CONFLICT (id) DO NOTHING;

-- requirements: students can upload, anyone can read, admin can delete
CREATE POLICY "req_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'requirements');

CREATE POLICY "req_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'requirements');

CREATE POLICY "req_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'requirements' AND public.is_admin());