create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  target_country text,
  target_countries text[] not null default '{}',
  target_intake text,
  major text,
  gpa text,
  sat text,
  ielts text,
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'Custom',
  label text not null check (char_length(label) between 1 and 240),
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deadline_reminders (
  user_id uuid not null references auth.users(id) on delete cascade,
  deadline_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, deadline_id)
);

create table if not exists public.saved_universities (
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, university_id)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id text not null,
  status text not null default 'researching' check (status in ('researching','shortlisted','documents','submitted','interview','decision')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, university_id)
);

create index if not exists planner_tasks_user_sort_idx on public.planner_tasks(user_id, sort_order, created_at);
create index if not exists applications_user_status_idx on public.applications(user_id, status);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists planner_tasks_set_updated_at on public.planner_tasks;
create trigger planner_tasks_set_updated_at before update on public.planner_tasks
for each row execute function public.set_updated_at();

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, target_country)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'target_country'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.planner_tasks enable row level security;
alter table public.deadline_reminders enable row level security;
alter table public.saved_universities enable row level security;
alter table public.applications enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_select" on public.profiles for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "planner_tasks_own_all" on public.planner_tasks for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "deadline_reminders_own_all" on public.deadline_reminders for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved_universities_own_all" on public.saved_universities for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "applications_own_all" on public.applications for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
