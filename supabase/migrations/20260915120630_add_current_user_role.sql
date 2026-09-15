create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

drop policy if exists "assignments_vet_insert" on public.assignments;
create policy "assignments_vet_insert" on public.assignments
  for insert with check (public.current_user_role() in ('vet', 'admin'));

drop policy if exists "assignments_vet_update" on public.assignments;
create policy "assignments_vet_update" on public.assignments
  for update using (public.current_user_role() in ('vet', 'admin'))
  with check (public.current_user_role() in ('vet', 'admin'));

drop policy if exists "assignments_admin_delete" on public.assignments;
create policy "assignments_admin_delete" on public.assignments
  for delete using (public.is_admin_user());

drop policy if exists "records_vet_update_any" on public.treatment_records;
create policy "records_vet_update_any" on public.treatment_records
  for update using (public.current_user_role() in ('vet', 'admin'))
  with check (public.current_user_role() in ('vet', 'admin'));

drop policy if exists "records_keeper_insert" on public.treatment_records;
drop policy if exists "records_vet_insert_any" on public.treatment_records;
create policy "records_vet_insert_any" on public.treatment_records
  for insert with check (public.current_user_role() in ('vet', 'admin'));
