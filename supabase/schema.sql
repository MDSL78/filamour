-- =========================================================
-- Filamour : schéma de base de données
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
-- =========================================================

-- ---------- Tables ----------

create table if not exists public.couples (
  id              uuid primary key default gen_random_uuid(),
  invite_code     text unique not null,
  since           date,
  wallpaper_path  text,
  premium_until   timestamptz,          -- rempli plus tard par le paiement Stripe (serveur uniquement)
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  couple_id   uuid references public.couples(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.memories (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples(id) on delete cascade,
  author_id    uuid not null references auth.users(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 120),
  happened_on  date not null,
  body         text check (char_length(body) <= 2000),
  photo_path   text,
  created_at   timestamptz not null default now()
);
create index if not exists memories_couple_idx on public.memories(couple_id, happened_on desc);

create table if not exists public.answers (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  question_date  date not null,
  answer         text not null check (char_length(answer) between 1 and 1000),
  created_at     timestamptz not null default now(),
  unique (user_id, question_date)
);
create index if not exists answers_couple_idx on public.answers(couple_id, question_date);

create table if not exists public.bucket_items (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 160),
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- Fonctions utilitaires ----------

-- Couple de l'utilisateur connecté
create or replace function public.my_couple_id()
returns uuid language sql stable security definer set search_path = public as $$
  select couple_id from public.profiles where id = auth.uid();
$$;

-- L'utilisateur connecté a-t-il déjà répondu à la question de ce jour ?
create or replace function public.has_answered(d date)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.answers where user_id = auth.uid() and question_date = d);
$$;

-- Profil créé automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Créer un couple (le premier partenaire)
create or replace function public.create_couple(p_first_name text, p_since date)
returns public.couples language plpgsql security definer set search_path = public as $$
declare
  c public.couples;
  code text;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  if (select couple_id from profiles where id = auth.uid()) is not null then
    raise exception 'Tu fais déjà partie d''un couple';
  end if;
  loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from couples where invite_code = code);
  end loop;
  insert into couples (invite_code, since, created_by) values (code, p_since, auth.uid()) returning * into c;
  update profiles set first_name = nullif(trim(p_first_name), ''), couple_id = c.id where id = auth.uid();
  return c;
end;
$$;

-- Rejoindre un couple avec le code d'invitation (le second partenaire)
create or replace function public.join_couple(p_first_name text, p_code text)
returns public.couples language plpgsql security definer set search_path = public as $$
declare
  c public.couples;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  if (select couple_id from profiles where id = auth.uid()) is not null then
    raise exception 'Tu fais déjà partie d''un couple';
  end if;
  select * into c from couples where invite_code = upper(trim(p_code));
  if c.id is null then raise exception 'Code introuvable. Vérifie-le avec ton ou ta partenaire.'; end if;
  if (select count(*) from profiles where couple_id = c.id) >= 2 then
    raise exception 'Ce couple est déjà complet.';
  end if;
  update profiles set first_name = nullif(trim(p_first_name), ''), couple_id = c.id where id = auth.uid();
  return c;
end;
$$;

-- ---------- Sécurité : chaque couple ne voit que ses propres données ----------

alter table public.couples      enable row level security;
alter table public.profiles     enable row level security;
alter table public.memories     enable row level security;
alter table public.answers      enable row level security;
alter table public.bucket_items enable row level security;

-- couples : lecture et modification limitées à son propre couple, colonnes restreintes
drop policy if exists couples_select on public.couples;
create policy couples_select on public.couples for select using (id = public.my_couple_id());
drop policy if exists couples_update on public.couples;
create policy couples_update on public.couples for update using (id = public.my_couple_id()) with check (id = public.my_couple_id());
revoke insert, update, delete on public.couples from anon, authenticated;
grant select on public.couples to authenticated;
grant update (since, wallpaper_path) on public.couples to authenticated;

-- profiles : on voit son profil et celui de son ou sa partenaire, on ne modifie que son prénom
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or (couple_id is not null and couple_id = public.my_couple_id()));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name) on public.profiles to authenticated;

-- memories
drop policy if exists memories_select on public.memories;
create policy memories_select on public.memories for select using (couple_id = public.my_couple_id());
drop policy if exists memories_insert on public.memories;
create policy memories_insert on public.memories for insert
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());
drop policy if exists memories_update on public.memories;
create policy memories_update on public.memories for update
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
drop policy if exists memories_delete on public.memories;
create policy memories_delete on public.memories for delete using (couple_id = public.my_couple_id());

-- answers : on voit toujours sa réponse ; celle de l'autre seulement après avoir répondu soi-même
drop policy if exists answers_select on public.answers;
create policy answers_select on public.answers for select using (
  couple_id = public.my_couple_id()
  and (user_id = auth.uid() or public.has_answered(question_date))
);
drop policy if exists answers_insert on public.answers;
create policy answers_insert on public.answers for insert
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());
drop policy if exists answers_update on public.answers;
create policy answers_update on public.answers for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());

-- bucket_items
drop policy if exists bucket_select on public.bucket_items;
create policy bucket_select on public.bucket_items for select using (couple_id = public.my_couple_id());
drop policy if exists bucket_insert on public.bucket_items;
create policy bucket_insert on public.bucket_items for insert with check (couple_id = public.my_couple_id());
drop policy if exists bucket_update on public.bucket_items;
create policy bucket_update on public.bucket_items for update
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
drop policy if exists bucket_delete on public.bucket_items;
create policy bucket_delete on public.bucket_items for delete using (couple_id = public.my_couple_id());

grant execute on function public.create_couple(text, date) to authenticated;
grant execute on function public.join_couple(text, text) to authenticated;

-- ---------- Photos : un dossier privé par couple ----------

insert into storage.buckets (id, name, public)
values ('couple-photos', 'couple-photos', false)
on conflict (id) do nothing;

drop policy if exists "photos_select" on storage.objects;
create policy "photos_select" on storage.objects for select to authenticated
  using (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);
drop policy if exists "photos_insert" on storage.objects;
create policy "photos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);
drop policy if exists "photos_delete" on storage.objects;
create policy "photos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);
