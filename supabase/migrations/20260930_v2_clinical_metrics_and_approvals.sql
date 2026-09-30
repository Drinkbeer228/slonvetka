-- Migration: v2_clinical_metrics_and_approvals
-- Description: Adds wash_status, limb_status, feet_photos, vital signs, and chief_approvals table.

-- 1. Profiles role check update
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('keeper', 'vet', 'admin', 'warehouse', 'chief', 'director'));

-- 2. Elephant Daily Metrics v2 columns
alter table public.elephant_daily_metrics
  add column if not exists sleep_state jsonb default '{"duration": "🟢 3-4ч (норма)"}',
  add column if not exists trunk_tone text default 'active',
  add column if not exists mucosa_tongue text default 'normal_pink',
  add column if not exists breathing_observation text default 'nasal_normal',
  add column if not exists gait_assessment text default 'stable',
  add column if not exists facial_edema text default 'none',
  add column if not exists vital_alert boolean default false,
  add column if not exists vital_photo_url text,
  add column if not exists wash_status text default 'not_washed',
  add column if not exists limb_status jsonb default '{"front_right":"ok","front_left":"ok","rear_right":"ok","rear_left":"ok"}',
  add column if not exists feet_photos jsonb default '{}',
  add column if not exists temporal_gland_score integer default 0,
  add column if not exists temporal_gland_washed boolean default false,
  add column if not exists temporal_gland_ointment boolean default false,
  add column if not exists temporal_gland_photo_url text,
  add column if not exists feeding_records jsonb default '[]',
  add column if not exists water_checked boolean default false;

-- 3. Chief Approvals Table
create table if not exists public.chief_approvals (
  id text primary key,
  shift_id text references public.daily_shifts(id) on delete set null,
  elephant_id text not null,
  elephant_name text not null,
  requested_by_id uuid references public.profiles(id),
  requested_by_name text not null,
  category text check (category in ('arena_cancel', 'urgent_med', 'ration_change', 'emergency')) not null,
  title text not null,
  reason text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  chief_comment text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS on chief_approvals
alter table public.chief_approvals enable row level security;

create policy "Allow all authenticated users to read chief_approvals"
  on public.chief_approvals for select to authenticated using (true);

create policy "Allow authenticated users to insert chief_approvals"
  on public.chief_approvals for insert to authenticated with check (true);

create policy "Allow admins and vets to update chief_approvals"
  on public.chief_approvals for update to authenticated using (true);
