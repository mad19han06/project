/*
# EduProject Hub — Core Schema

## Purpose
Creates the full data model for a student project booking & management platform:
profiles (students/admins), projects catalog, orders, payments, deliverable files,
notifications, support tickets, and payment QR codes.

## Tables

1. `profiles` — extends `auth.users` with role + student-specific fields.
   - `id` uuid PK, references `auth.users(id)` ON DELETE CASCADE.
   - `full_name` text.
   - `phone` text.
   - `role` text ('student' | 'admin'), default 'student'.
   - `department`, `college`, `year` text (student info).
   - `resume_url`, `avatar_url` text (Supabase Storage public URLs).
   - `created_at` timestamptz default now().

2. `projects` — catalog of purchasable projects.
   - `id` uuid PK.
   - `title`, `description`, `technology`, `category` text.
   - `duration_weeks` int.
   - `price` numeric(10,2).
   - `difficulty` text ('Beginner' | 'Intermediate' | 'Advanced').
   - `image_url` text.
   - `is_active` bool default true.
   - `created_at` timestamptz default now().

3. `orders` — a student's booking of a project (catalog purchase or custom request).
   - `id` uuid PK.
   - `student_id` uuid -> profiles.
   - `project_id` uuid -> projects (nullable for custom requests).
   - `requirements` text (custom requirements).
   - `deadline` date.
   - `status` text (progress stage).
   - `order_date` timestamptz default now().
   - `amount` numeric(10,2).

4. `payments` — payment records for orders.
   - `id` uuid PK.
   - `order_id` uuid -> orders.
   - `amount` numeric(10,2).
   - `screenshot_url` text.
   - `status` text ('Pending' | 'Verification Pending' | 'Approved' | 'Rejected').
   - `created_at` timestamptz default now().
   - `verified_at` timestamptz.

5. `deliverable_files` — files uploaded by admin for an order.
   - `id` uuid PK.
   - `order_id` uuid -> orders.
   - `file_name` text.
   - `file_url` text.
   - `file_type` text ('Source Code' | 'Documentation' | 'Presentation' | 'Report' | 'Database' | 'Other').
   - `created_at` timestamptz default now().

6. `notifications` — user-facing notifications.
   - `id` uuid PK.
   - `user_id` uuid -> auth.users.
   - `message` text.
   - `type` text.
   - `is_read` bool default false.
   - `created_at` timestamptz default now().

7. `tickets` — support tickets raised by students.
   - `id` uuid PK.
   - `student_id` uuid -> profiles.
   - `subject`, `message` text.
   - `status` text ('Open' | 'In Progress' | 'Resolved' | 'Closed').
   - `admin_reply` text.
   - `created_at` timestamptz default now().

8. `qr_codes` — admin-managed UPI QR codes for payments.
   - `id` uuid PK.
   - `label` text.
   - `image_url` text.
   - `upi_id` text.
   - `is_active` bool default true.
   - `created_at` timestamptz default now().

## Security (RLS)
- All tables get RLS enabled.
- `profiles`: each user reads/updates own row; admins read all (via role check).
- `projects`, `qr_codes`: readable by anon + authenticated (catalog is public); writes admin-only via service role (client uses anon, so writes restricted to authenticated admins through role check).
- `orders`, `payments`, `deliverable_files`, `notifications`, `tickets`: owner-scoped for students; admins can read all via role check.
- Owner columns default to `auth.uid()` where the client inserts without passing them.

## Notes
1. Admin role is stored in `profiles.role`. Policies that need admin access check `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`.
2. `orders.student_id` defaults to `auth.uid()` so student inserts omitting it still pass the WITH CHECK.
3. The catalog is intentionally public-readable so the landing/catalog page works without sign-in.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'student',
  department text DEFAULT '',
  college text DEFAULT '',
  year text DEFAULT '',
  resume_url text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_select_own_or_admin" ON profiles;
CREATE POLICY "profile_select_own_or_admin" ON profiles FOR SELECT
TO authenticated USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "profile_insert_own" ON profiles;
CREATE POLICY "profile_insert_own" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profile_update_own" ON profiles;
CREATE POLICY "profile_update_own" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  technology text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  duration_weeks int NOT NULL DEFAULT 4,
  price numeric(10,2) NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'Beginner',
  image_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_public" ON projects;
CREATE POLICY "projects_select_public" ON projects FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "projects_insert_admin" ON projects;
CREATE POLICY "projects_insert_admin" ON projects FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "projects_update_admin" ON projects;
CREATE POLICY "projects_update_admin" ON projects FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "projects_delete_admin" ON projects;
CREATE POLICY "projects_delete_admin" ON projects FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  requirements text DEFAULT '',
  deadline date,
  status text NOT NULL DEFAULT 'Request Submitted',
  order_date timestamptz NOT NULL DEFAULT now(),
  amount numeric(10,2) NOT NULL DEFAULT 0
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
CREATE POLICY "orders_select_own_or_admin" ON orders FOR SELECT
TO authenticated USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
TO authenticated WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "orders_update_own_or_admin" ON orders;
CREATE POLICY "orders_update_own_or_admin" ON orders FOR UPDATE
TO authenticated USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin" ON orders FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  screenshot_url text DEFAULT '',
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own_or_admin" ON payments;
CREATE POLICY "payments_select_own_or_admin" ON payments FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = payments.order_id AND o.student_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = payments.order_id AND o.student_id = auth.uid())
);

DROP POLICY IF EXISTS "payments_update_admin" ON payments;
CREATE POLICY "payments_update_admin" ON payments FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "payments_delete_admin" ON payments;
CREATE POLICY "payments_delete_admin" ON payments FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- deliverable_files
CREATE TABLE IF NOT EXISTS deliverable_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'Other',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE deliverable_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "files_select_own_or_admin" ON deliverable_files;
CREATE POLICY "files_select_own_or_admin" ON deliverable_files FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = deliverable_files.order_id AND o.student_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "files_insert_admin" ON deliverable_files;
CREATE POLICY "files_insert_admin" ON deliverable_files FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "files_delete_admin" ON deliverable_files;
CREATE POLICY "files_delete_admin" ON deliverable_files FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own_or_admin" ON notifications;
CREATE POLICY "notif_select_own_or_admin" ON notifications FOR SELECT
TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "notif_insert_own_or_admin" ON notifications;
CREATE POLICY "notif_insert_own_or_admin" ON notifications FOR INSERT
TO authenticated WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE
TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_delete_admin" ON notifications;
CREATE POLICY "notif_delete_admin" ON notifications FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Open',
  admin_reply text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select_own_or_admin" ON tickets;
CREATE POLICY "tickets_select_own_or_admin" ON tickets FOR SELECT
TO authenticated USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "tickets_insert_own" ON tickets;
CREATE POLICY "tickets_insert_own" ON tickets FOR INSERT
TO authenticated WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "tickets_update_own_or_admin" ON tickets;
CREATE POLICY "tickets_update_own_or_admin" ON tickets FOR UPDATE
TO authenticated USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- qr_codes
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT 'UPI',
  image_url text NOT NULL DEFAULT '',
  upi_id text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_select_public" ON qr_codes;
CREATE POLICY "qr_select_public" ON qr_codes FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "qr_insert_admin" ON qr_codes;
CREATE POLICY "qr_insert_admin" ON qr_codes FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "qr_update_admin" ON qr_codes;
CREATE POLICY "qr_update_admin" ON qr_codes FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "qr_delete_admin" ON qr_codes;
CREATE POLICY "qr_delete_admin" ON qr_codes FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_project ON orders(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_files_order ON deliverable_files(order_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_student ON tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'role', 'student'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();