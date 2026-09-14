-- Supabase Schema for Слоновник Вет
-- v2: Строгие RLS политики + недостающие таблицы daily_shifts, elephant_daily_metrics

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text check (role in ('keeper', 'vet', 'director', 'admin')) not null,
  invite_code text unique,
  active boolean default true,
  is_admin boolean default false,
  birth_date date,
  avatar_url text,
  current_session_id text,
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

-- DAILY SHIFTS (смены дежурства)
create table public.daily_shifts (
  id text primary key, -- format: 'shift_YYYY-MM-DD_<random>'
  date date not null unique,
  duty_keeper_id uuid references public.profiles(id),
  status text check (status in ('in_progress', 'completed', 'submitted', 'handover_pending')) default 'in_progress',
  hay_bales_distributed integer default 0 check (hay_bales_distributed >= 0),
  hay_bags_distributed integer default 0 check (hay_bags_distributed >= 0),
  reminders jsonb default '[]',
  feed_notes text default '',
  handover_notes text default '',
  handover_to_keeper_id uuid references public.profiles(id),
  handover_complaints jsonb default '[]',
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ELEPHANT DAILY METRICS (физиология per слон per смена)
create table public.elephant_daily_metrics (
  id text primary key, -- format: 'metric_<shift_id>_<elephant_id>_<random>'
  shift_id text references public.daily_shifts(id) on delete cascade not null,
  elephant_id uuid references public.elephants(id) not null,
  poop_count integer default 0 check (poop_count >= 0),
  feces_traits jsonb default '["Сформирован (норма)"]',
  urination_count integer default 0 check (urination_count >= 0),
  urination_traits jsonb default '["Прозрачная (норма)"]',
  behavior text default 'Спокойная / В норме',
  sleep_minutes integer default 0 check (sleep_minutes >= 0 and sleep_minutes <= 720), -- max 12h per shift
  sleep_intervals jsonb default '[]',
  notes text default '',
  photos jsonb default '[]', -- массив ShiftPhoto объектов (base64 dataUrl)
  unique (shift_id, elephant_id)
);

-- FEED INVENTORY (учет остатков кормов на складе: сено, рулоны, ветки)
create table public.feed_inventory (
  item_type text primary key, -- 'hay_bales', 'hay_rolls', 'branches'
  quantity_in_stock integer not null default 0 check (quantity_in_stock >= 0),
  unit text default 'шт',
  updated_at timestamptz default now()
);

-- ============================================================
-- RPC for secure login by invite code
-- ============================================================
create or replace function login_by_invite_code(code text)
returns json
language plpgsql
security definer -- runs as superuser to bypass RLS for initial lookup
as $$
declare
  found_profile record;
begin
  select id, name, role, active, is_admin
  into found_profile
  from public.profiles
  where invite_code = code and active = true;

  if found_profile.id is null then
    return null;
  end if;

  return row_to_json(found_profile);
end;
$$;

-- ============================================================
-- RPC to register device session (single active session)
-- ============================================================
create or replace function register_device_session(user_id uuid, session_token text)
returns void
language sql
security definer
as $$
  update public.profiles set current_session_id = session_token where id = user_id;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.elephants enable row level security;
alter table public.assignments enable row level security;
alter table public.treatment_records enable row level security;
alter table public.treatment_photos enable row level security;
alter table public.daily_shifts enable row level security;
alter table public.elephant_daily_metrics enable row level security;
alter table public.feed_inventory enable row level security;

-- Helper: получить роль текущего пользователя
create or replace function current_user_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: является ли текущий пользователь администратором
create or replace function is_admin_user()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(is_admin, false) or role = 'admin'
  from public.profiles where id = auth.uid();
$$;

-- ---- PROFILES ----
-- Все аутентифицированные могут читать профили (для отображения имён)
create policy "profiles_select" on public.profiles
  for select using (auth.uid() is not null);

-- Только сам пользователь может обновить свой профиль (кроме роли)
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Только admin может создавать/удалять профили
create policy "profiles_admin_all" on public.profiles
  for all using (is_admin_user())
  with check (is_admin_user());

-- ---- ELEPHANTS ----
-- Все аутентифицированные могут читать
create policy "elephants_select" on public.elephants
  for select using (auth.uid() is not null);

-- Только vet/admin могут создавать/изменять слонов
create policy "elephants_vet_admin_write" on public.elephants
  for insert with check (current_user_role() in ('vet', 'admin', 'director'));

create policy "elephants_vet_admin_update" on public.elephants
  for update using (current_user_role() in ('vet', 'admin', 'director'));

-- ---- ASSIGNMENTS ----
-- Все аутентифицированные читают активные назначения
create policy "assignments_select" on public.assignments
  for select using (auth.uid() is not null);

-- Только vet/admin/director создают назначения
create policy "assignments_vet_insert" on public.assignments
  for insert with check (current_user_role() in ('vet', 'admin', 'director'));

-- Только vet/admin/director обновляют назначения
create policy "assignments_vet_update" on public.assignments
  for update using (current_user_role() in ('vet', 'admin', 'director'));

-- Только admin могут удалять назначения
create policy "assignments_admin_delete" on public.assignments
  for delete using (is_admin_user());

-- ---- TREATMENT RECORDS ----
-- Все аутентифицированные читают записи
create policy "records_select" on public.treatment_records
  for select using (auth.uid() is not null);

-- Кипер может добавлять только свои записи
create policy "records_keeper_insert" on public.treatment_records
  for insert with check (keeper_id = auth.uid());

-- Кипер может обновлять только СВОИ записи (не архивные — не старше 24ч)
create policy "records_keeper_update_own" on public.treatment_records
  for update using (
    keeper_id = auth.uid() and
    performed_at > now() - interval '24 hours'
  )
  with check (keeper_id = auth.uid());

-- Vet/admin могут обновлять любые записи
create policy "records_vet_update_any" on public.treatment_records
  for update using (current_user_role() in ('vet', 'admin', 'director'));

-- Только admin может удалять записи
create policy "records_admin_delete" on public.treatment_records
  for delete using (is_admin_user());

-- ---- TREATMENT PHOTOS ----
-- Все аутентифицированные читают фото
create policy "photos_select" on public.treatment_photos
  for select using (auth.uid() is not null);

-- Фото добавляет тот, кто создал запись
create policy "photos_insert" on public.treatment_photos
  for insert with check (
    exists (
      select 1 from public.treatment_records
      where id = treatment_record_id and keeper_id = auth.uid()
    )
  );

-- Только admin удаляет фото
create policy "photos_admin_delete" on public.treatment_photos
  for delete using (is_admin_user());

-- ---- DAILY SHIFTS ----
-- Все аутентифицированные читают смены
create policy "shifts_select" on public.daily_shifts
  for select using (auth.uid() is not null);

-- Кипер создаёт смену дня
create policy "shifts_insert" on public.daily_shifts
  for insert with check (auth.uid() is not null);

-- Кипер обновляет только текущую/завтрашнюю смену (не архив)
create policy "shifts_keeper_update" on public.daily_shifts
  for update using (
    auth.uid() is not null and
    (date >= current_date - 1 or is_admin_user())
  );

-- ---- ELEPHANT DAILY METRICS ----
-- Все аутентифицированные читают метрики
create policy "metrics_select" on public.elephant_daily_metrics
  for select using (auth.uid() is not null);

-- Кипер вставляет метрики для текущей смены
create policy "metrics_insert" on public.elephant_daily_metrics
  for insert with check (
    auth.uid() is not null and
    exists (
      select 1 from public.daily_shifts
      where id = shift_id and date >= current_date - 1
    )
  );

-- Кипер обновляет метрики текущей смены; admin — любые
create policy "metrics_update" on public.elephant_daily_metrics
  for update using (
    auth.uid() is not null and
    (
      is_admin_user() or
      exists (
        select 1 from public.daily_shifts
        where id = shift_id and date >= current_date - 1
      )
    )
  );

-- ---- FEED INVENTORY ----
-- Все аутентифицированные читают остатки кормов
create policy "feed_inventory_select" on public.feed_inventory
  for select using (auth.uid() is not null);

-- Киперы, ветврачи и админы могут обновлять остатки / списывать
create policy "feed_inventory_update" on public.feed_inventory
  for update using (auth.uid() is not null);

create policy "feed_inventory_insert" on public.feed_inventory
  for insert with check (auth.uid() is not null);

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('elephant-treatments', 'elephant-treatments', false)
  on conflict (id) do nothing;

-- Только аутентифицированные могут загружать в папку своего uid
create policy "storage_authenticated_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'elephant-treatments' and
    auth.uid() is not null and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Все аутентифицированные могут читать (для просмотра фото)
create policy "storage_authenticated_select"
  on storage.objects for select
  using (
    bucket_id = 'elephant-treatments' and
    auth.uid() is not null
  );

-- Только владелец или admin может удалять
create policy "storage_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'elephant-treatments' and
    (
      (storage.foldername(name))[1] = auth.uid()::text or
      is_admin_user()
    )
  );

-- ============================================================
-- DEFAULT DATA
-- ============================================================
insert into public.elephants (name) values ('Прэтти'), ('Марго'), ('Одри')
  on conflict do nothing;

insert into public.profiles (name, role, invite_code) values
  ('Иван (Кипер)', 'keeper', 'KEEPER-IVAN-24'),
  ('Сергей (Кипер)', 'keeper', 'KEEPER-SERGEY'),
  ('Алексей (Ветврач)', 'vet', 'VET-DOC-77')
  on conflict do nothing;

insert into public.feed_inventory (item_type, quantity_in_stock, unit) values
  ('hay_bales', 200, 'тюков'),
  ('hay_rolls', 15, 'рулонов'),
  ('branches', 50, 'веников')
  on conflict (item_type) do nothing;
