-- Run this AFTER the original NovaArcade schema.
-- This adds a secure admin allow-list. Do NOT make games writable by anon users.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

create policy "Admins can read their own admin record"
on public.admin_users for select
using (auth.uid() = user_id);

create policy "Admins can insert games"
on public.games for insert
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can update games"
on public.games for update
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can delete games"
on public.games for delete
using (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can insert categories"
on public.categories for insert
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can update categories"
on public.categories for update
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can delete categories"
on public.categories for delete
using (exists (select 1 from public.admin_users where user_id = auth.uid()));
