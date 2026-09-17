create table public.comeback_diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idol_id uuid not null references public.idols(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  first_listen_rating smallint check (first_listen_rating between 1 and 5),
  first_favorite_song_id uuid references public.idol_songs(id) on delete set null,
  later_favorite_song_id uuid references public.idol_songs(id) on delete set null,
  want_to_hear_live_song_id uuid references public.idol_songs(id) on delete set null,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.comeback_diaries enable row level security;

create policy "Users can read own comeback diaries"
on public.comeback_diaries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add own comeback diaries"
on public.comeback_diaries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own comeback diaries"
on public.comeback_diaries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own comeback diaries"
on public.comeback_diaries for delete to authenticated
using ((select auth.uid()) = user_id);

create index comeback_diaries_user_event_idx
on public.comeback_diaries (user_id, event_id);

create index comeback_diaries_user_idol_created_idx
on public.comeback_diaries (user_id, idol_id, created_at desc);
