create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

insert into public.admin_allowlist (email)
values ('rayana.jumadulla@gmail.com')
on conflict (email) do nothing;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);

alter table public.admin_allowlist enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "admin_allowlist_admin_select" on public.admin_allowlist for select
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_audit_log_admin_select" on public.admin_audit_log for select
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.assign_allowlisted_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.admin_allowlist where email = lower(coalesce(new.email, ''))) then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_assign_admin on auth.users;
create trigger on_auth_user_assign_admin after insert on auth.users
for each row execute function public.assign_allowlisted_admin();

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(coalesce(email, '')) in (select email from public.admin_allowlist);
