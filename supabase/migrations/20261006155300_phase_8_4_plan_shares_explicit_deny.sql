-- Phase 8.4 defense-in-depth policy marker.
-- Direct client table access remains revoked. This policy makes the intentional
-- Edge-Function-only access model explicit to RLS tooling as well.
create policy "plan shares deny direct client access"
on public.plan_shares
for all
to anon, authenticated
using (false)
with check (false);
