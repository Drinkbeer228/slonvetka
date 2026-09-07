-- Supabase Schema for Слоновник Вет

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text check (role in ('keeper', 'vet')) not null,
  invite_code text unique,
  active boolean default true,
  created_at timestamptz default now()
);

-- ELEPHANTS
create table public.elephants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- ASSIGNMENTS
create table public.assignments (
  id uuid primary key default uuid_generate_v4(),
  elephant_id uuid references public.elephants(id) not null,
  title text not null,
  description text,
  schedule_type text not null, -- 'daily', 'weekly', 'as_needed'
  requires_photo boolean default true,
  requires_before_after boolean default false,
  assessment_type text, -- 'none', 'normal_or_issue', 'needs_cleaning', 'result'
  medicine text,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TREATMENT RECORDS
create table public.treatment_records (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid references public.assignments(id),
  elephant_id uuid references public.elephants(id) not null,
  keeper_id uuid references public.profiles(id) not null,
  performed_at timestamptz default now(),
  assessment text,
  medicine_used text,
  comment text,
  created_at timestamptz default now()
);

-- TREATMENT PHOTOS
create table public.treatment_photos (
  id uuid primary key default uuid_generate_v4(),
  treatment_record_id uuid references public.treatment_records(id) on delete cascade not null,
  storage_path text not null,
  photo_type text not null, -- 'single', 'before', 'after'
  created_at timestamptz default now()
);

-- RPC for secure login by invite code
create or replace function login_by_invite_code(code text)
returns json
language plpgsql
security definer -- important: runs as superuser to bypass RLS on profiles for the initial lookup
as $$
declare
  found_profile record;
begin
  select id, name, role, active 
  into found_profile
  from public.profiles
  where invite_code = code and active = true;

  if found_profile.id is null then
    return null;
  end if;

  return row_to_json(found_profile);
end;
$$;


-- ROW LEVEL SECURITY (RLS)

alter table public.profiles enable row level security;
alter table public.elephants enable row level security;
alter table public.assignments enable row level security;
alter table public.treatment_records enable row level security;
alter table public.treatment_photos enable row level security;

-- Keepers and Vets can read profiles (to show names in history)
create policy "Anyone can read profiles" on public.profiles for select using (true);

-- Anyone can read elephants
create policy "Anyone can read elephants" on public.elephants for select using (true);

-- Anyone can read active assignments
create policy "Anyone can read assignments" on public.assignments for select using (true);

-- Vets can insert/update assignments
-- Assuming we don't have true Supabase Auth, we rely on the application logic and role checks.
-- For a robust setup, if using anonymous sessions, RLS might need to be fully open or rely on custom claims.
-- For this MVP where users just enter a code, we'll allow all operations, but the UI restricts them.
-- To properly enforce, we would use set_config to pass the user ID, but let's keep it simple for now:
create policy "Allow all for assignments" on public.assignments using (true) with check (true);
create policy "Allow all for records" on public.treatment_records using (true) with check (true);
create policy "Allow all for photos" on public.treatment_photos using (true) with check (true);

-- STORAGE SETUP
-- Requires running in Supabase SQL Editor or migration tool
insert into storage.buckets (id, name, public) values ('elephant-treatments', 'elephant-treatments', false);

-- Enable RLS for storage
-- Allow all for MVP (authenticated via anon key)
create policy "Allow all operations on treatments bucket"
on storage.objects for all
using (bucket_id = 'elephant-treatments')
with check (bucket_id = 'elephant-treatments');

-- DEFAULT DATA
insert into public.elephants (name) values ('Прэтти'), ('Марго'), ('Одри');

insert into public.profiles (name, role, invite_code) values 
('Иван (Кипер)', 'keeper', 'KEEPER-IVAN-24'),
('Сергей (Кипер)', 'keeper', 'KEEPER-SERGEY'),
('Алексей (Ветврач)', 'vet', 'VET-DOC-77');
