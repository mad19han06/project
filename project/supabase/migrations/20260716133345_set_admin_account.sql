/*
# Set up admin account for madhanofficial1909@gmail.com

## Purpose
Updates the existing auth.users record for madhanofficial1909@gmail.com with
the specified password and ensures the corresponding profile row has role='admin'.

## Changes
1. Updates `auth.users.encrypted_password` for the admin email using bcrypt.
2. Confirms email and sets last sign-in metadata.
3. Upserts `public.profiles` row with role='admin', full_name='Madhan'.

## Notes
- This is a one-time admin provisioning step.
- The password is hashed with `crypt(..., gen_salt('bf'))` to match Supabase's auth format.
*/

UPDATE auth.users
SET
  encrypted_password = crypt('madhan@123#456$789', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now(),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name": "Madhan", "role": "admin"}'::jsonb
WHERE email = 'madhanofficial1909@gmail.com';

INSERT INTO public.profiles (id, full_name, role, phone, department, college, year)
SELECT id, 'Madhan', 'admin', '', 'Administration', 'EduProject Hub', ''
FROM auth.users
WHERE email = 'madhanofficial1909@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', full_name = 'Madhan';