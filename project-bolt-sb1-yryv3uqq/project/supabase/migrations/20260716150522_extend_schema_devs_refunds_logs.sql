/*
# Extend schema: developer assignment, refund support, activity logs

## Purpose
Adds missing fields and tables required by the feature spec:
1. `orders.assigned_developer` — admin can assign a project to a developer name.
2. `payments.refund_status` / `payments.refunded_at` — refund management.
3. `activity_logs` table — audit trail for key actions (order, payment, auth, etc.).

## Changes
1. ALTER `orders`: add `assigned_developer text DEFAULT ''`.
2. ALTER `payments`: add `refund_status text DEFAULT NULL`, `refunded_at timestamptz DEFAULT NULL`.
3. CREATE `activity_logs` table with RLS — admin-only read, authenticated insert.

## Notes
- All ALTERs use `IF NOT EXISTS` via DO block to be idempotent.
- `activity_logs` uses `is_admin()` for admin read access; any authenticated
  user can insert a log row (the app logs actions on behalf of the user).
*/

-- orders.assigned_developer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'assigned_developer') THEN
    ALTER TABLE orders ADD COLUMN assigned_developer text DEFAULT '';
  END IF;
END $$;

-- payments refund fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'refund_status') THEN
    ALTER TABLE payments ADD COLUMN refund_status text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'refunded_at') THEN
    ALTER TABLE payments ADD COLUMN refunded_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT '',
  entity_type text DEFAULT '',
  entity_id text DEFAULT '',
  details text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_admin" ON activity_logs;
CREATE POLICY "logs_select_admin" ON activity_logs FOR SELECT
TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "logs_insert_auth" ON activity_logs;
CREATE POLICY "logs_insert_auth" ON activity_logs FOR INSERT
TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC);