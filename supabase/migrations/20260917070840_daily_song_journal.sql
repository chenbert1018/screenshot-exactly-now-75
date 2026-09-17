-- 每日音樂日記：只記錄使用者選擇的歌曲與當下心情，不保存音檔或串流內容。
create table if not exists public.idol_song_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idol_id uuid not null references public.idols(id) on delete cascade,
  song_id uuid references public.idol_songs(id) on delete set null,
  entry_date date not null,
  mood text check (mood in ('🥹', '💗', '😭', '✨', '🔥') or mood is null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idol_id, entry_date)
);

alter table public.idol_song_journal_entries enable row level security;

create policy "Users can read own daily song journal"
on public.idol_song_journal_entries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own daily song journal"
on public.idol_song_journal_entries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own daily song journal"
on public.idol_song_journal_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own daily song journal"
on public.idol_song_journal_entries for delete to authenticated
using ((select auth.uid()) = user_id);

create index if not exists idol_song_journal_entries_user_date_idx
on public.idol_song_journal_entries (user_id, entry_date desc);

create index if not exists idol_song_journal_entries_song_idx
on public.idol_song_journal_entries (song_id)
where song_id is not null;
