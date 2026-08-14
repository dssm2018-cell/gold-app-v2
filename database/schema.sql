-- Gold App V2 / Supabase foundation
create extension if not exists pgcrypto;

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  section text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(owner_id, section)
);

create table if not exists public.app_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
alter table public.app_state enable row level security;

drop policy if exists "owner settings" on public.app_settings;
create policy "owner settings" on public.app_settings
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "owner state" on public.app_state;
create policy "owner state" on public.app_state
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Optional future normalized tables. They can be enabled later without changing the client architecture.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text, phone text, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.audit_log (
  id bigint generated always as identity primary key, owner_id uuid not null references auth.users(id) on delete cascade,
  action text not null, section text, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.audit_log enable row level security;

create policy "owner products" on public.products for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owner customers" on public.customers for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owner audit" on public.audit_log for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
