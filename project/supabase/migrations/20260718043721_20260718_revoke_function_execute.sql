/*
# Revoke EXECUTE on SECURITY DEFINER functions from non-trigger roles

## Context
The earlier `REVOKE ... FROM PUBLIC` did not remove role-specific grants
that were created by the original migrations. This migration explicitly
revokes EXECUTE from the relevant roles.

## Result
- `handle_new_user()` — trigger-only; EXECUTE revoked from anon,
  authenticated, and service_role. The trigger still runs because Postgres
  invokes trigger functions with the function owner's privileges.
- `is_admin()` — EXECUTE revoked from PUBLIC and anon. Authenticated
  retains EXECUTE because RLS policies on `public` tables call it.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;