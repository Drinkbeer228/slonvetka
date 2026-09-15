create extension if not exists "uuid-ossp";

create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_id uuid references public.profiles(id),
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

alter table public.profiles
  drop column if exists is_admin;

alter table public.profiles
  add column is_admin boolean generated always as (role = 'admin') stored;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'keeper',
    true
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.can_manage_inventory()
returns boolean
language sql
security definer
stable
as $$
  select public.is_admin_user()
    or exists (
      select 1
      from public.daily_shifts
      where duty_keeper_id = auth.uid()
        and date = current_date
    );
$$;

create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_role text;
begin
  if not public.is_admin_user() then
    raise exception 'Only admins can change roles';
  end if;

  if new_role not in ('keeper', 'vet', 'director', 'admin') then
    raise exception 'Invalid role: %', new_role;
  end if;

  select role
    into old_role
  from public.profiles
  where id = target_user_id
  for update;

  if old_role is null then
    raise exception 'Profile not found for user %', target_user_id;
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id;

  insert into public.audit_log (actor_id, action, target_id, old_value, new_value, reason)
  values (
    auth.uid(),
    'admin_set_user_role',
    target_user_id,
    jsonb_build_object('role', old_role, 'is_admin', old_role = 'admin'),
    jsonb_build_object('role', new_role, 'is_admin', new_role = 'admin'),
    null
  );
end;
$$;

revoke update (role) on public.profiles from anon, authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_admin_delete" on public.profiles;
drop policy if exists "audit_log_admin_select" on public.audit_log;
drop policy if exists "assignments_vet_insert" on public.assignments;
drop policy if exists "assignments_vet_update" on public.assignments;
drop policy if exists "records_vet_update_any" on public.treatment_records;
drop policy if exists "shifts_insert" on public.daily_shifts;
drop policy if exists "shifts_keeper_update" on public.daily_shifts;
drop policy if exists "shifts_keeper_delete" on public.daily_shifts;
drop policy if exists "metrics_insert" on public.elephant_daily_metrics;
drop policy if exists "metrics_update" on public.elephant_daily_metrics;
drop policy if exists "feed_inventory_update" on public.feed_inventory;
drop policy if exists "feed_inventory_insert" on public.feed_inventory;

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_admin_delete" on public.profiles
  for delete using (is_admin_user());

create policy "audit_log_admin_select" on public.audit_log
  for select using (is_admin_user());

create policy "assignments_vet_insert" on public.assignments
  for insert with check (current_user_role() in ('vet', 'admin'));

create policy "assignments_vet_update" on public.assignments
  for update using (current_user_role() in ('vet', 'admin'))
  with check (current_user_role() in ('vet', 'admin'));

create policy "records_vet_update_any" on public.treatment_records
  for update using (current_user_role() in ('vet', 'admin'))
  with check (current_user_role() in ('vet', 'admin'));

create policy "shifts_insert" on public.daily_shifts
  for insert with check (
    auth.uid() is not null
    and (
      is_admin_user()
      or duty_keeper_id is null
      or duty_keeper_id = auth.uid()
    )
  );

create policy "shifts_keeper_update" on public.daily_shifts
  for update using (
    is_admin_user()
    or (
      date = current_date
      and (
        duty_keeper_id = auth.uid()
        or duty_keeper_id is null
        or (handover_to_keeper_id = auth.uid() and status = 'handover_pending')
      )
    )
  )
  with check (
    is_admin_user()
    or (
      date = current_date
      and (
        duty_keeper_id = auth.uid()
        or exists (
          select 1
          from public.daily_shifts as existing_shift
          where existing_shift.id = daily_shifts.id
            and existing_shift.handover_to_keeper_id = auth.uid()
            and existing_shift.status = 'handover_pending'
            and existing_shift.date = current_date
        )
      )
    )
  );

create policy "shifts_keeper_delete" on public.daily_shifts
  for delete using (
    is_admin_user()
    or (
      date = current_date
      and duty_keeper_id = auth.uid()
    )
  );

create policy "metrics_insert" on public.elephant_daily_metrics
  for insert with check (
    is_admin_user()
    or exists (
      select 1
      from public.daily_shifts
      where id = shift_id
        and duty_keeper_id = auth.uid()
        and date = current_date
    )
  );

create policy "metrics_update" on public.elephant_daily_metrics
  for update using (
    is_admin_user()
    or exists (
      select 1
      from public.daily_shifts
      where id = shift_id
        and duty_keeper_id = auth.uid()
        and date = current_date
    )
  )
  with check (
    is_admin_user()
    or exists (
      select 1
      from public.daily_shifts
      where id = shift_id
        and duty_keeper_id = auth.uid()
        and date = current_date
    )
  );

create policy "feed_inventory_update" on public.feed_inventory
  for update using (can_manage_inventory())
  with check (can_manage_inventory());

create policy "feed_inventory_insert" on public.feed_inventory
  for insert with check (can_manage_inventory());
