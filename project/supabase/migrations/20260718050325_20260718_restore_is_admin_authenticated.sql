/*
# Restore EXECUTE on is_admin() for authenticated (RLS dependency)

## Context
The previous migration revoked EXECUTE on `is_admin()` from
`authenticated`. This broke RLS: every policy that calls `is_admin()`
raised "permission denied for function is_admin" because Postgres
checks EXECUTE even when a function is invoked from a policy expression.

## Fix
Re-grant EXECUTE to `authenticated`. The function is intentionally
SECURITY DEFINER so it can read `profiles.role` without recursing through
the profiles RLS policies.

## Risk assessment
`is_admin()` only returns a boolean indicating whether the caller's
profile has role='admin'. It cannot read or modify any other data.
Direct RPC exposure to authenticated users is low-risk because:
  - The caller can only learn their own admin status (already implied
    by what their session can access).
  - The function takes no arguments and exposes no other rows.
*/

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;