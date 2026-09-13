-- Run this once in your Supabase project's SQL editor (Dashboard -> SQL Editor).
-- Both tables have Row Level Security enabled so a user can only ever read or
-- write their own rows — this is what actually protects this data, not the
-- secrecy of the client-side anon key.
--
-- This assumes "Automatically expose new tables" is OFF in Project Settings ->
-- Data API (recommended: keep access explicit rather than default-granted for
-- sensitive data). That means RLS alone isn't enough — a role also needs
-- table-level GRANTs before RLS gets a chance to filter rows, which is what
-- the `grant` statements below provide. Only `authenticated` gets access;
-- `anon` gets none, since the app requires sign-in before touching any data.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  avg_cycle_length int not null default 28,
  avg_period_length int not null default 5,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "individuals can manage their own profile" on profiles;
create policy "individuals can manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update, delete on profiles to authenticated;

alter table profiles add column if not exists temperature_unit text
  not null default 'fahrenheit' check (temperature_unit in ('fahrenheit', 'celsius'));

create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

alter table cycles enable row level security;

drop policy if exists "individuals can manage their own cycles" on cycles;
create policy "individuals can manage their own cycles"
  on cycles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on cycles to authenticated;

create index if not exists cycles_user_id_start_date_idx
  on cycles (user_id, start_date desc);

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  temperature_celsius numeric(4,2),
  symptoms text[] not null default '{}',
  intimacy boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table daily_logs enable row level security;

drop policy if exists "individuals can manage their own daily logs" on daily_logs;
create policy "individuals can manage their own daily logs"
  on daily_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on daily_logs to authenticated;

create index if not exists daily_logs_user_id_log_date_idx
  on daily_logs (user_id, log_date desc);
