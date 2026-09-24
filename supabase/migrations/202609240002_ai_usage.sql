create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null default 'assistant',
  provider text not null default 'openai',
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_created_idx on public.ai_usage(user_id, created_at desc);

alter table public.ai_usage enable row level security;

create policy "ai_usage_select_own" on public.ai_usage for select
using (auth.uid() = user_id);

create policy "ai_usage_admin_select" on public.ai_usage for select
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
