-- C-3: FCM device push tokens table
create table if not exists public.device_push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  token      text not null,
  platform   text not null check (platform in ('android', 'ios')),
  updated_at timestamptz default now(),
  unique (user_id, platform)
);

alter table public.device_push_tokens enable row level security;

-- Users can upsert and delete their own token row
create policy "device_push_tokens_user_upsert" on public.device_push_tokens
  for insert with check (user_id = auth.uid());

create policy "device_push_tokens_user_update" on public.device_push_tokens
  for update using (user_id = auth.uid());

create policy "device_push_tokens_user_delete" on public.device_push_tokens
  for delete using (user_id = auth.uid());

-- Service role can read all rows (required by the Edge Function to fetch tokens)
-- (service role bypasses RLS; this is here for documentation purposes)
