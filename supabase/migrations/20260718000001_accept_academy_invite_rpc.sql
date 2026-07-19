-- AO-5: RPC to accept an academy invite
-- SECURITY DEFINER runs as the function owner (service role), bypassing caller RLS
create or replace function public.accept_academy_invite(invite_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite      public.academy_invites%rowtype;
  v_academy     public.academies%rowtype;
  v_caller_uid  uuid := auth.uid();
begin
  -- Must be authenticated
  if v_caller_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Look up the invite by token
  select * into v_invite
  from public.academy_invites
  where token = invite_token
  limit 1;

  if not found then
    raise exception 'INVITE_NOT_FOUND: This invite link is not valid.';
  end if;

  -- Check expiry
  if v_invite.expires_at < now() then
    raise exception 'INVITE_EXPIRED: This invite link has expired.';
  end if;

  -- Check already used
  if v_invite.used_at is not null then
    raise exception 'INVITE_ALREADY_USED: This invite has already been used.';
  end if;

  -- Check caller not already in any academy
  if exists (
    select 1 from public.academy_members
    where user_id = v_caller_uid
  ) then
    raise exception 'ALREADY_MEMBER: You already belong to an academy.';
  end if;

  -- D1: coach-role invites require an active coaches row
  if v_invite.role = 'coach' then
    if not exists (
      select 1 from public.coaches
      where user_id = v_caller_uid
        and is_active = true
    ) then
      raise exception 'NO_COACH_PROFILE: You must complete your coach profile before joining an academy as a coach.';
    end if;
  end if;

  -- Insert into academy_members
  insert into public.academy_members (academy_id, user_id, role, joined_at)
  values (v_invite.academy_id, v_caller_uid, v_invite.role, now());

  -- Mark invite as used
  update public.academy_invites
  set used_by = v_caller_uid, used_at = now()
  where id = v_invite.id;

  -- Fetch academy info to return to caller
  select * into v_academy
  from public.academies
  where id = v_invite.academy_id;

  return json_build_object(
    'success', true,
    'academy_id', v_academy.id,
    'academy_name', v_academy.name,
    'role', v_invite.role
  );
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.accept_academy_invite(text) to authenticated;
