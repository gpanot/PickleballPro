-- AO-5: Academy invite tokens table
create table if not exists public.academy_invites (
  id         uuid primary key default gen_random_uuid(),
  academy_id uuid references public.academies(id) on delete cascade not null,
  token      text unique not null default encode(gen_random_bytes(24), 'base64url'),
  role       text not null check (role in ('coach','staff','manager')) default 'coach',
  created_by uuid references auth.users(id) not null,
  expires_at timestamptz not null default now() + interval '7 days',
  used_by    uuid references auth.users(id),
  used_at    timestamptz,
  created_at timestamptz default now()
);

alter table public.academy_invites enable row level security;

-- Manager of the academy can select, insert, delete their own academy rows
create policy "academy_invites_manager_select" on public.academy_invites
  for select using (
    exists (
      select 1 from public.academy_members
      where academy_members.academy_id = academy_invites.academy_id
        and academy_members.user_id = auth.uid()
        and academy_members.role = 'manager'
    )
  );

create policy "academy_invites_manager_insert" on public.academy_invites
  for insert with check (
    exists (
      select 1 from public.academy_members
      where academy_members.academy_id = academy_invites.academy_id
        and academy_members.user_id = auth.uid()
        and academy_members.role = 'manager'
    )
  );

create policy "academy_invites_manager_delete" on public.academy_invites
  for delete using (
    exists (
      select 1 from public.academy_members
      where academy_members.academy_id = academy_invites.academy_id
        and academy_members.user_id = auth.uid()
        and academy_members.role = 'manager'
    )
  );

-- Any authenticated user can read a single row by token (for accept flow lookup)
create policy "academy_invites_read_by_token" on public.academy_invites
  for select using (auth.uid() is not null);
