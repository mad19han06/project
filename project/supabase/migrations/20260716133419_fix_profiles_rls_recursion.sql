/*
# Fix infinite recursion in profiles RLS policies

## Problem
The `profiles` table policies reference `profiles` in a subquery to check if the
current user is an admin. This causes infinite recursion because evaluating the
policy on `profiles` triggers the policy again.

## Fix
1. Create a `SECURITY DEFINER` helper function `is_admin()` that checks the
   caller's role in `profiles` without being subject to RLS (since SECURITY
   DEFINER functions run with the function owner's privileges and bypass RLS
   when the owner is a superuser or the function is explicitly granted).
2. Replace the recursive subquery in all policies with a call to `is_admin()`.
3. Apply the same fix to all tables whose policies check admin role via
   subqueries on `profiles`: projects, orders, payments, deliverable_files,
   notifications, tickets, qr_codes.

## Notes
- `is_admin()` returns true if `auth.uid()` matches a profile with role='admin'.
- The function is marked SECURITY DEFINER and owned by postgres, so it bypasses
  RLS on profiles when reading the role.
- All policies now use `public.is_admin()` instead of the recursive EXISTS
  subquery.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- profiles: replace recursive policy
DROP POLICY IF EXISTS "profile_select_own_or_admin" ON profiles;
CREATE POLICY "profile_select_own_or_admin" ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id OR public.is_admin());

-- projects
DROP POLICY IF EXISTS "projects_insert_admin" ON projects;
CREATE POLICY "projects_insert_admin" ON projects FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "projects_update_admin" ON projects;
CREATE POLICY "projects_update_admin" ON projects FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "projects_delete_admin" ON projects;
CREATE POLICY "projects_delete_admin" ON projects FOR DELETE
TO authenticated USING (public.is_admin());

-- orders
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
CREATE POLICY "orders_select_own_or_admin" ON orders FOR SELECT
TO authenticated USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_update_own_or_admin" ON orders;
CREATE POLICY "orders_update_own_or_admin" ON orders FOR UPDATE
TO authenticated USING (student_id = auth.uid() OR public.is_admin())
WITH CHECK (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin" ON orders FOR DELETE
TO authenticated USING (public.is_admin());

-- payments
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON payments;
CREATE POLICY "payments_select_own_or_admin" ON payments FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = payments.order_id AND o.student_id = auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "payments_update_admin" ON payments;
CREATE POLICY "payments_update_admin" ON payments FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payments_delete_admin" ON payments;
CREATE POLICY "payments_delete_admin" ON payments FOR DELETE
TO authenticated USING (public.is_admin());

-- deliverable_files
DROP POLICY IF EXISTS "files_select_own_or_admin" ON deliverable_files;
CREATE POLICY "files_select_own_or_admin" ON deliverable_files FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = deliverable_files.order_id AND o.student_id = auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "files_insert_admin" ON deliverable_files;
CREATE POLICY "files_insert_admin" ON deliverable_files FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "files_delete_admin" ON deliverable_files;
CREATE POLICY "files_delete_admin" ON deliverable_files FOR DELETE
TO authenticated USING (public.is_admin());

-- notifications
DROP POLICY IF EXISTS "notif_select_own_or_admin" ON notifications;
CREATE POLICY "notif_select_own_or_admin" ON notifications FOR SELECT
TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notif_insert_own_or_admin" ON notifications;
CREATE POLICY "notif_insert_own_or_admin" ON notifications FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notif_delete_admin" ON notifications;
CREATE POLICY "notif_delete_admin" ON notifications FOR DELETE
TO authenticated USING (public.is_admin());

-- tickets
DROP POLICY IF EXISTS "tickets_select_own_or_admin" ON tickets;
CREATE POLICY "tickets_select_own_or_admin" ON tickets FOR SELECT
TO authenticated USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "tickets_update_own_or_admin" ON tickets;
CREATE POLICY "tickets_update_own_or_admin" ON tickets FOR UPDATE
TO authenticated USING (student_id = auth.uid() OR public.is_admin())
WITH CHECK (student_id = auth.uid() OR public.is_admin());

-- qr_codes
DROP POLICY IF EXISTS "qr_insert_admin" ON qr_codes;
CREATE POLICY "qr_insert_admin" ON qr_codes FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "qr_update_admin" ON qr_codes;
CREATE POLICY "qr_update_admin" ON qr_codes FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "qr_delete_admin" ON qr_codes;
CREATE POLICY "qr_delete_admin" ON qr_codes FOR DELETE
TO authenticated USING (public.is_admin());