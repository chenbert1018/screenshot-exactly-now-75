create table if not exists public.idol_song_listen_again_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idol_id uuid not null references public.idols(id) on delete cascade,
  song_id uuid not null references public.idol_songs(id) on delete cascade,
  source_journal_entry_id uuid references public.idol_song_journal_entries(id) on delete set null,
  original_date date not null,
  original_mood text check (
    original_mood is null or
    original_mood in ('🥹', '💗', '😭', '✨', '🔥')
  ),
  listen_again_date date not null,
  current_mood text not null check (
    current_mood in ('🥹', '💗', '😭', '✨', '🔥')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint idol_song_listen_again_daily_unique
    unique (user_id, idol_id, song_id, listen_again_date)
);

create index if not exists idol_song_listen_again_user_idol_date_idx
  on public.idol_song_listen_again_entries
  (user_id, idol_id, listen_again_date desc);

create index if not exists idol_song_listen_again_song_idx
  on public.idol_song_listen_again_entries(song_id);

alter table public.idol_song_listen_again_entries enable row level security;

create policy "Users can read own listen again entries"
on public.idol_song_listen_again_entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own listen again entries"
on public.idol_song_listen_again_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own listen again entries"
on public.idol_song_listen_again_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own listen again entries"
on public.idol_song_listen_again_entries
for delete
to authenticated
using (auth.uid() = user_id);
