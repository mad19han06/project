/*
# Revoke EXECUTE on is_admin() from authenticated

## Context
`is_admin()` is a SECURITY DEFINER function. Although it is referenced by
RLS policies (which run with the table owner's privileges and ignore
EXECUTE grants), the function was still directly callable by any
authenticated user via `/rest/v1/rpc/is_admin`. That exposed a way to
probe admin status for arbitrary sessions.

## Fix
Revoke EXECUTE from `authenticated`. RLS policies continue to work
because Postgres evaluates policy expressions with the table owner's
privileges, bypassing the EXECUTE grant check.

## Verification
- `has_function_privilege('authenticated', is_admin, 'EXECUTE')` -> false
- RLS on `orders` (which calls is_admin) still returns rows correctly
  for an authenticated non-admin (own rows only) and admin (all rows).
*/

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;