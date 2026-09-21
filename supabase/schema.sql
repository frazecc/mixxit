create extension if not exists "pgcrypto";

create type public.card_type as enum ('monster', 'sorcery', 'instant', 'extra', 'structure', 'equipment', 'territory');
create type public.card_status as enum ('active', 'inactive');
create type public.user_role as enum ('player', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Giocatore',
  role public.user_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  card_code text not null unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  status public.card_status not null default 'inactive',
  current_version_id uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_versions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  version_number integer not null,
  name text not null,
  card_type public.card_type not null,
  mana_cost integer not null check (mana_cost >= 0 and mana_cost <= 20),
  attack integer check (attack is null or attack >= 0),
  health integer check (health is null or health >= 1),
  sacrifice_requirement integer not null default 0 check (sacrifice_requirement >= 0 and sacrifice_requirement <= 5),
  special_requirement jsonb not null default '{}'::jsonb,
  rules_text text not null,
  effect_code text not null default 'none',
  effect_parameters jsonb not null default '{}'::jsonb,
  timing text not null default 'main_phase',
  tags text[] not null default '{}'::text[],
  rarity text not null default 'Comune',
  threat_rating numeric(8,2),
  image_path text,
  image_crop jsonb not null default '{"x":0,"y":0,"zoom":1}'::jsonb,
  frame_style text not null default 'monster',
  engine_supported boolean not null default true,
  ai_supported boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(card_id, version_number)
);

alter table public.cards
  add constraint cards_current_version_fk
  foreign key (current_version_id) references public.card_versions(id) on delete set null;

create table if not exists public.game_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_game_set
  on public.game_sets ((is_active)) where is_active = true;

create table if not exists public.game_set_cards (
  game_set_id uuid not null references public.game_sets(id) on delete cascade,
  card_version_id uuid not null references public.card_versions(id) on delete restrict,
  copies_allowed integer not null default 3 check (copies_allowed between 1 and 9),
  primary key (game_set_id, card_version_id)
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_ai_deck boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deck_cards (
  deck_id uuid not null references public.decks(id) on delete cascade,
  card_version_id uuid not null references public.card_versions(id) on delete restrict,
  zone text not null check (zone in ('main', 'extra', 'side')),
  quantity integer not null check (quantity between 1 and 3),
  primary key (deck_id, card_version_id, zone)
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  player_deck_id uuid references public.decks(id) on delete set null,
  ai_deck_id uuid references public.decks(id) on delete set null,
  rule_version text not null default 'v1',
  ai_version text not null default 'debug-v1',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  winner text check (winner in ('player', 'ai')),
  final_turn integer,
  player_final_hp integer,
  ai_final_hp integer,
  revealed_ai_card_version_id uuid references public.card_versions(id) on delete set null,
  replay_json jsonb not null default '{}'::jsonb,
  replay_card_snapshots jsonb not null default '{}'::jsonb,
  share_token uuid unique,
  is_shared boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists games_owner_created_idx on public.games(owner_id, created_at desc);
create index if not exists card_versions_card_idx on public.card_versions(card_id, version_number desc);
create index if not exists deck_cards_deck_idx on public.deck_cards(deck_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Giocatore'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists cards_updated_at on public.cards;
create trigger cards_updated_at before update on public.cards
for each row execute procedure public.set_updated_at();

drop trigger if exists game_sets_updated_at on public.game_sets;
create trigger game_sets_updated_at before update on public.game_sets
for each row execute procedure public.set_updated_at();

drop trigger if exists decks_updated_at on public.decks;
create trigger decks_updated_at before update on public.decks
for each row execute procedure public.set_updated_at();

drop trigger if exists games_updated_at on public.games;
create trigger games_updated_at before update on public.games
for each row execute procedure public.set_updated_at();

create or replace function public.create_card_with_version(
  p_card_code text,
  p_name text,
  p_card_type public.card_type,
  p_mana_cost integer,
  p_attack integer,
  p_health integer,
  p_sacrifice_requirement integer,
  p_special_requirement jsonb,
  p_rules_text text,
  p_effect_code text,
  p_effect_parameters jsonb,
  p_timing text,
  p_tags text[],
  p_rarity text,
  p_threat_rating numeric,
  p_image_path text,
  p_image_crop jsonb,
  p_frame_style text,
  p_engine_supported boolean,
  p_ai_supported boolean,
  p_status public.card_status default 'inactive'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card_id uuid;
  v_version_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo admin';
  end if;

  insert into public.cards (card_code, owner_id, status)
  values (p_card_code, auth.uid(), p_status)
  returning id into v_card_id;

  insert into public.card_versions (
    card_id, version_number, name, card_type, mana_cost, attack, health,
    sacrifice_requirement, special_requirement, rules_text, effect_code,
    effect_parameters, timing, tags, rarity, threat_rating, image_path,
    image_crop, frame_style, engine_supported, ai_supported, created_by
  ) values (
    v_card_id, 1, p_name, p_card_type, p_mana_cost, p_attack, p_health,
    p_sacrifice_requirement, coalesce(p_special_requirement, '{}'::jsonb), p_rules_text, p_effect_code,
    coalesce(p_effect_parameters, '{}'::jsonb), p_timing, coalesce(p_tags, '{}'::text[]), p_rarity, p_threat_rating, p_image_path,
    coalesce(p_image_crop, '{"x":0,"y":0,"zoom":1}'::jsonb), p_frame_style, p_engine_supported, p_ai_supported, auth.uid()
  ) returning id into v_version_id;

  update public.cards set current_version_id = v_version_id where id = v_card_id;
  return v_card_id;
end;
$$;

create or replace function public.create_card_version(
  p_card_id uuid,
  p_name text,
  p_card_type public.card_type,
  p_mana_cost integer,
  p_attack integer,
  p_health integer,
  p_sacrifice_requirement integer,
  p_special_requirement jsonb,
  p_rules_text text,
  p_effect_code text,
  p_effect_parameters jsonb,
  p_timing text,
  p_tags text[],
  p_rarity text,
  p_threat_rating numeric,
  p_image_path text,
  p_image_crop jsonb,
  p_frame_style text,
  p_engine_supported boolean,
  p_ai_supported boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number integer;
  v_version_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo admin';
  end if;

  select coalesce(max(version_number), 0) + 1 into v_number
  from public.card_versions where card_id = p_card_id;

  insert into public.card_versions (
    card_id, version_number, name, card_type, mana_cost, attack, health,
    sacrifice_requirement, special_requirement, rules_text, effect_code,
    effect_parameters, timing, tags, rarity, threat_rating, image_path,
    image_crop, frame_style, engine_supported, ai_supported, created_by
  ) values (
    p_card_id, v_number, p_name, p_card_type, p_mana_cost, p_attack, p_health,
    p_sacrifice_requirement, coalesce(p_special_requirement, '{}'::jsonb), p_rules_text, p_effect_code,
    coalesce(p_effect_parameters, '{}'::jsonb), p_timing, coalesce(p_tags, '{}'::text[]), p_rarity, p_threat_rating, p_image_path,
    coalesce(p_image_crop, '{"x":0,"y":0,"zoom":1}'::jsonb), p_frame_style, p_engine_supported, p_ai_supported, auth.uid()
  ) returning id into v_version_id;

  update public.cards set current_version_id = v_version_id where id = p_card_id;
  return v_version_id;
end;
$$;