-- IdolDays 音樂回憶：只保存歌曲資訊與合法串流連結，不保存音檔。
create table if not exists public.idol_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idol_id uuid not null references public.idols(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  artist text not null default '' check (char_length(artist) <= 160),
  album text not null default '' check (char_length(album) <= 160),
  apple_music_url text not null default '' check (char_length(apple_music_url) <= 2048),
  spotify_url text not null default '' check (char_length(spotify_url) <= 2048),
  is_today_pick boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.idol_songs enable row level security;

create policy "Users can read own idol songs"
on public.idol_songs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own idol songs"
on public.idol_songs for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own idol songs"
on public.idol_songs for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own idol songs"
on public.idol_songs for delete to authenticated
using ((select auth.uid()) = user_id);

create unique index if not exists idol_songs_one_today_pick_per_user_idol
on public.idol_songs (user_id, idol_id)
where is_today_pick;

create index if not exists idol_songs_user_idol_created_idx
on public.idol_songs (user_id, idol_id, created_at desc);

create table if not exists public.idol_song_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idol_id uuid not null references public.idols(id) on delete cascade,
  song_id uuid not null references public.idol_songs(id) on delete cascade,
  role text not null check (role in (
    'FIRST_FANDOM', 'FAVORITE', 'FIRST_CONCERT', 'WANT_TO_HEAR_LIVE', 'ON_REPEAT', 'THINK_OF_THEM'
  )),
  created_at timestamptz not null default now(),
  unique (user_id, idol_id, role)
);

alter table public.idol_song_roles enable row level security;

create policy "Users can read own song roles"
on public.idol_song_roles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own song roles"
on public.idol_song_roles for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own song roles"
on public.idol_song_roles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own song roles"
on public.idol_song_roles for delete to authenticated
using ((select auth.uid()) = user_id);

create index if not exists idol_song_roles_user_idol_idx
on public.idol_song_roles (user_id, idol_id);

alter table public.memories
  add column if not exists song_id uuid references public.idol_songs(id) on delete set null;

create index if not exists memories_song_id_idx
on public.memories (song_id)
where song_id is not null;
