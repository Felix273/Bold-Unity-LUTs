-- Adds the fields and authenticated RPCs needed for demo and future Paystack payments.
-- Run this migration in the Supabase SQL editor before enabling demo persistence.

drop policy if exists "Authenticated users can read LUT assets" on storage.objects;
drop policy if exists "Entitled users can read LUT assets" on storage.objects;

create policy "Entitled users can read LUT assets"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'lut-assets'
    and (
      exists (
        select 1
          from public.luts
         where luts.file_url = storage.objects.name
           and luts.price = 0
      )
      or exists (
        select 1
          from public.user_purchases
         where user_purchases.user_id = auth.uid()
           and user_purchases.lut_id = (
             select luts.id
               from public.luts
              where luts.file_url = storage.objects.name
              limit 1
           )
           and user_purchases.status = 'paid'
      )
      or exists (
        select 1
          from public.user_profiles
         where user_profiles.user_id = auth.uid()
           and lower(user_profiles.plan) in ('pro', 'studio')
           and user_profiles.status = 'active'
      )
    )
  );

alter table public.user_purchases
  add column if not exists payment_reference text,
  add column if not exists currency text not null default 'KES',
  add column if not exists status text not null default 'paid';

create unique index if not exists user_purchases_payment_reference_idx
  on public.user_purchases (payment_reference)
  where payment_reference is not null;

alter table public.user_profiles
  add column if not exists subscription_reference text,
  add column if not exists payment_provider text,
  add column if not exists is_admin boolean not null default false;

alter table public.subscription_plans enable row level security;

drop policy if exists "Anyone can view subscription plans" on public.subscription_plans;
create policy "Anyone can view subscription plans"
  on public.subscription_plans
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage subscription plans" on public.subscription_plans;
create policy "Admins can manage subscription plans"
  on public.subscription_plans
  for all
  to authenticated
  using (exists (select 1 from public.user_profiles where user_id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.user_profiles where user_id = auth.uid() and is_admin = true));

drop policy if exists "Admins can manage LUT assets" on storage.objects;
create policy "Admins can manage LUT assets"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id in ('lut-assets', 'lut-previews')
    and exists (select 1 from public.user_profiles where user_id = auth.uid() and is_admin = true)
  )
  with check (
    bucket_id in ('lut-assets', 'lut-previews')
    and exists (select 1 from public.user_profiles where user_id = auth.uid() and is_admin = true)
  );

alter table public.luts enable row level security;

drop policy if exists "Anyone can view LUTs" on public.luts;
create policy "Anyone can view LUTs"
  on public.luts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage LUTs" on public.luts;
create policy "Admins can manage LUTs"
  on public.luts
  for all
  to authenticated
  using (exists (select 1 from public.user_profiles where user_id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.user_profiles where user_id = auth.uid() and is_admin = true));

create or replace function public.record_demo_purchase(
  p_lut_id uuid,
  p_title text,
  p_amount numeric,
  p_currency text,
  p_reference text
)
returns public.user_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase public.user_purchases;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
    into purchase
    from public.user_purchases
   where user_id = auth.uid()
     and lut_id = p_lut_id
   limit 1;

  if purchase.id is not null then
    return purchase;
  end if;

  insert into public.user_purchases (
    user_id,
    lut_id,
    title,
    amount,
    payment_method,
    payment_reference,
    currency,
    status
  ) values (
    auth.uid(),
    p_lut_id,
    p_title,
    p_amount,
    'paystack_demo',
    p_reference,
    upper(p_currency),
    'paid'
  )
  on conflict (user_id, lut_id) do nothing
  returning * into purchase;

  if purchase.id is null then
    select *
      into purchase
      from public.user_purchases
     where user_id = auth.uid()
       and lut_id = p_lut_id
     limit 1;
  end if;

  return purchase;
end;
$$;

create or replace function public.record_demo_subscription(
  p_plan text,
  p_billing_cycle text,
  p_reference text
)
returns public.user_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.user_profiles;
  plan_limit integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select download_limit
    into plan_limit
    from public.subscription_plans
   where lower(name) = lower(p_plan)
   limit 1;

  update public.user_profiles
     set plan = lower(p_plan),
         billing_cycle = lower(p_billing_cycle),
         status = 'active',
         downloads_limit = coalesce(plan_limit, 0),
         subscription_reference = p_reference,
         payment_provider = 'paystack_demo',
         updated_at = now()
   where user_id = auth.uid()
   returning * into profile_row;

  if profile_row.user_id is null then
    insert into public.user_profiles (
      user_id,
      email,
      plan,
      billing_cycle,
      status,
      downloads_limit,
      subscription_reference,
      payment_provider
    )
    select
      id,
      coalesce(email, ''),
      lower(p_plan),
      lower(p_billing_cycle),
      'active',
      coalesce(plan_limit, 0),
      p_reference,
      'paystack_demo'
    from auth.users
    where id = auth.uid()
    returning * into profile_row;
  end if;

  return profile_row;
end;
$$;

create or replace function public.record_demo_download(
  p_lut_id uuid,
  p_title text
)
returns public.user_downloads
language plpgsql
security definer
set search_path = public
as $$
declare
  download_row public.user_downloads;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_downloads (user_id, lut_id, title)
  values (auth.uid(), p_lut_id, p_title)
  returning * into download_row;

    update public.luts
       set downloads = downloads + 1,
           updated_at = now()
     where id = p_lut_id;

  return download_row;
end;
$$;

revoke all on function public.record_demo_purchase(uuid, text, numeric, text, text) from public;
grant execute on function public.record_demo_purchase(uuid, text, numeric, text, text) to authenticated;

revoke all on function public.record_demo_subscription(text, text, text) from public;
grant execute on function public.record_demo_subscription(text, text, text) to authenticated;

revoke all on function public.record_demo_download(uuid, text) from public;
grant execute on function public.record_demo_download(uuid, text) to authenticated;

alter table public.reviews
  add column if not exists user_id uuid,
  add column if not exists lut_id uuid,
  add column if not exists rating integer,
  add column if not exists comment text,
  add column if not exists status text not null default 'pending';

alter table public.reviews enable row level security;

drop policy if exists "Anyone can view approved reviews" on public.reviews;
create policy "Anyone can view approved reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "Users can create own reviews" on public.reviews;
create policy "Users can create own reviews"
  on public.reviews
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Admins can moderate reviews" on public.reviews;
create policy "Admins can moderate reviews"
  on public.reviews
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where user_id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.user_profiles where user_id = auth.uid() and is_admin = true));

create or replace function public.submit_review(
  p_lut_id uuid,
  p_rating integer,
  p_comment text
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  review_row public.reviews;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  if not exists (
    select 1 from public.user_purchases
     where user_id = auth.uid() and lut_id = p_lut_id and status = 'paid'
  ) then
    raise exception 'A verified purchase is required to review this LUT';
  end if;

  insert into public.reviews (user_id, lut_id, rating, comment, status)
  values (auth.uid(), p_lut_id, p_rating, nullif(trim(p_comment), ''), 'pending')
  returning * into review_row;
  return review_row;
end;
$$;

revoke all on function public.submit_review(uuid, integer, text) from public;
grant execute on function public.submit_review(uuid, integer, text) to authenticated;

create or replace function public.cancel_subscription()
returns public.user_profiles
language plpgsql
security definer
set search_path = public
as $$
declare profile_row public.user_profiles;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.user_profiles
     set status = 'cancelled', updated_at = now()
   where user_id = auth.uid()
   returning * into profile_row;
  return profile_row;
end;
$$;

revoke all on function public.cancel_subscription() from public;
grant execute on function public.cancel_subscription() to authenticated;
