-- ============================================================
-- HyperFoco — Migração inicial do banco de dados
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  plan text not null default 'basic' check (plan in ('basic', 'pro')),
  plan_status text not null default 'active' check (plan_status in ('active', 'canceled', 'past_due', 'trial')),
  asaas_customer_id text unique,
  asaas_subscription_id text unique,
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now()
);

-- 2. TASKS
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('produzir', 'decidir', 'resolver', 'delegar')),
  priority int not null default 99,
  energy_level text not null default 'mid' check (energy_level in ('high', 'mid', 'low')),
  status text not null default 'pending' check (status in ('pending', 'done', 'snoozed', 'waiting')),
  estimated_minutes int not null default 15,
  due_date date,
  waiting_until timestamptz,
  delegated_to text,
  is_mission_today boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- 3. NEXT ACTIONS
create table if not exists public.next_actions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. FOCUS SESSIONS
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  duration_minutes int,
  outcome text check (outcome in ('done', 'continue', 'snoozed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- 5. ENERGY CHECK-INS
create table if not exists public.energy_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  level text not null check (level in ('high', 'mid', 'low')),
  checked_at timestamptz not null default now()
);

-- 6. DAILY MISSIONS
create table if not exists public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  mission_date date not null default current_date,
  completed boolean not null default false,
  unique(user_id, mission_date)
);

-- 7. SUBSCRIPTION EVENTS
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  asaas_payment_id text,
  amount_cents int,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.next_actions enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.energy_checkins enable row level security;
alter table public.daily_missions enable row level security;
alter table public.subscription_events enable row level security;

-- Profiles
create policy "users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Tasks
create policy "users can view own tasks"
  on public.tasks for select using (auth.uid() = user_id);

create policy "users can insert own tasks"
  on public.tasks for insert with check (auth.uid() = user_id);

create policy "users can update own tasks"
  on public.tasks for update using (auth.uid() = user_id);

create policy "users can delete own tasks"
  on public.tasks for delete using (auth.uid() = user_id);

-- Next Actions
create policy "users can manage next actions via task"
  on public.next_actions for all
  using (exists (
    select 1 from public.tasks
    where tasks.id = next_actions.task_id
    and tasks.user_id = auth.uid()
  ));

-- Focus Sessions
create policy "users can manage own sessions"
  on public.focus_sessions for all using (auth.uid() = user_id);

-- Energy Checkins
create policy "users can manage own checkins"
  on public.energy_checkins for all using (auth.uid() = user_id);

-- Daily Missions
create policy "users can manage own missions"
  on public.daily_missions for all using (auth.uid() = user_id);

-- Subscription Events
create policy "users can view own events"
  on public.subscription_events for select using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: criar profile automaticamente ao registrar
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, plan, plan_status, locale)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    'basic',
    'active',
    'pt-BR'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ÍNDICES para performance
-- ============================================================

create index if not exists tasks_user_status_idx on public.tasks(user_id, status);
create index if not exists tasks_user_category_idx on public.tasks(user_id, category);
create index if not exists focus_sessions_user_idx on public.focus_sessions(user_id);
create index if not exists energy_checkins_user_date_idx on public.energy_checkins(user_id, checked_at);
create index if not exists daily_missions_user_date_idx on public.daily_missions(user_id, mission_date);

-- ============================================================
-- Realtime: habilitar para tasks
-- ============================================================

alter publication supabase_realtime add table public.tasks;
