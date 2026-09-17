create table public.concert_music_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idol_id uuid not null references public.idols(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  want_to_hear_song_id uuid references public.idol_songs(id) on delete set null,
  opening_song_id uuid references public.idol_songs(id) on delete set null,
  finally_heard_song_id uuid references public.idol_songs(id) on delete set null,
  tearjerker_song_id uuid references public.idol_songs(id) on delete set null,
  hype_song_id uuid references public.idol_songs(id) on delete set null,
  unforgettable_song_id uuid references public.idol_songs(id) on delete set null,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.concert_music_memories enable row level security;

create policy "Users can read own concert music memories"
on public.concert_music_memories for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add own concert music memories"
on public.concert_music_memories for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own concert music memories"
on public.concert_music_memories for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own concert music memories"
on public.concert_music_memories for delete to authenticated
using ((select auth.uid()) = user_id);

create index concert_music_memories_user_event_idx
on public.concert_music_memories (user_id, event_id);

create index concert_music_memories_user_idol_created_idx
on public.concert_music_memories (user_id, idol_id, created_at desc);
