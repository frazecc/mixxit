alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.card_versions enable row level security;
alter table public.game_sets enable row level security;
alter table public.game_set_cards enable row level security;
alter table public.decks enable row level security;
alter table public.deck_cards enable row level security;
alter table public.games enable row level security;

create policy "profiles: own read" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "profiles: own update" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "cards: active public read" on public.cards
for select using ((status = 'active' and deleted_at is null) or public.is_admin());

create policy "cards: admin insert" on public.cards
for insert to authenticated with check (public.is_admin());

create policy "cards: admin update" on public.cards
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "cards: admin delete" on public.cards
for delete to authenticated using (public.is_admin());

create policy "versions: active card public read" on public.card_versions
for select using (
  public.is_admin()
  or exists (
    select 1 from public.cards c
    where c.id = card_versions.card_id
      and c.status = 'active'
      and c.deleted_at is null
      and c.current_version_id = card_versions.id
  )
);

create policy "versions: admin insert" on public.card_versions
for insert to authenticated with check (public.is_admin());

create policy "versions: admin update" on public.card_versions
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "versions: admin delete" on public.card_versions
for delete to authenticated using (public.is_admin());

create policy "sets: active public read" on public.game_sets
for select using (is_active = true or public.is_admin());

create policy "sets: admin write" on public.game_sets
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "set cards: public active-set read" on public.game_set_cards
for select using (
  public.is_admin() or exists (
    select 1 from public.game_sets gs
    where gs.id = game_set_cards.game_set_id and gs.is_active = true
  )
);

create policy "set cards: admin write" on public.game_set_cards
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "decks: owner or admin read" on public.decks
for select to authenticated using (owner_id = auth.uid() or public.is_admin());

create policy "decks: owner insert" on public.decks
for insert to authenticated with check (owner_id = auth.uid() or public.is_admin());

create policy "decks: owner update" on public.decks
for update to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

create policy "decks: owner delete" on public.decks
for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

create policy "deck cards: deck owner or admin read" on public.deck_cards
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.decks d where d.id = deck_cards.deck_id and d.owner_id = auth.uid()
  )
);

create policy "deck cards: deck owner or admin write" on public.deck_cards
for all to authenticated using (
  public.is_admin() or exists (
    select 1 from public.decks d where d.id = deck_cards.deck_id and d.owner_id = auth.uid()
  )
) with check (
  public.is_admin() or exists (
    select 1 from public.decks d where d.id = deck_cards.deck_id and d.owner_id = auth.uid()
  )
);

create policy "games: owner or admin read" on public.games
for select to authenticated using (owner_id = auth.uid() or public.is_admin() or (is_shared = true and share_token is not null));

create policy "games: owner insert" on public.games
for insert to authenticated with check (owner_id = auth.uid());

create policy "games: owner update" on public.games
for update to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

create policy "games: owner delete" on public.games
for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('card-art', 'card-art', false)
on conflict (id) do update set public = false;

create policy "card-art: active artwork read" on storage.objects
for select using (
  bucket_id = 'card-art'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.card_versions cv
      join public.cards c on c.id = cv.card_id
      where cv.image_path = storage.objects.name
        and c.status = 'active'
        and c.deleted_at is null
    )
  )
);

create policy "card-art: admin upload" on storage.objects
for insert to authenticated with check (bucket_id = 'card-art' and public.is_admin());

create policy "card-art: admin update" on storage.objects
for update to authenticated using (bucket_id = 'card-art' and public.is_admin()) with check (bucket_id = 'card-art' and public.is_admin());

create policy "card-art: admin delete" on storage.objects
for delete to authenticated using (bucket_id = 'card-art' and public.is_admin());