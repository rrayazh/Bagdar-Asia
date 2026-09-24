insert into public.admin_allowlist (email)
values ('aiarubaikonys23@gmail.com')
on conflict (email) do nothing;

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(coalesce(email, '')) = 'aiarubaikonys23@gmail.com';
