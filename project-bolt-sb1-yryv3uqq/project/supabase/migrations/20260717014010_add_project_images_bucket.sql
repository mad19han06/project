/*
# Add `project-images` bucket for admin-uploaded project catalog images

## Purpose
Allows admins to upload project images directly from the AdminProjects page
instead of only pasting an external image URL. The uploaded image's public
URL is stored in `projects.image_url`.
*/

INSERT INTO storage.buckets (id, name, public) VALUES
  ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- project-images: admin can upload/read/delete; anyone can read (public bucket)
CREATE POLICY "projimg_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images' AND public.is_admin());

CREATE POLICY "projimg_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-images');

CREATE POLICY "projimg_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'project-images' AND public.is_admin());

CREATE POLICY "projimg_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-images' AND public.is_admin());