/*
# Storage Buckets for EduProject Hub

## Purpose
Creates public storage buckets for:
1. `avatars` — student profile pictures.
2. `resumes` — student resume uploads.
3. `payment-screenshots` — UPI payment screenshot uploads.
4. `deliverables` — admin-uploaded project deliverable files.
5. `qr-codes` — admin-uploaded UPI QR code images.

All buckets are public so the frontend can read images via public URLs.
*/

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('resumes', 'resumes', true),
  ('payment-screenshots', 'payment-screenshots', true),
  ('deliverables', 'deliverables', true),
  ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;