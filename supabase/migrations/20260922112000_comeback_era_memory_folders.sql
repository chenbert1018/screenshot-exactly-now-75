-- Link a user's Comeback event to exactly one Memory Folder without copying diary content.
create table public.comeback_era_memory_folders (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  folder_id uuid not null references public.memory_folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id),
  unique (folder_id)
);

alter table public.comeback_era_memory_folders enable row level security;

create policy "Users can read own comeback era folders"
on public.comeback_era_memory_folders for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add own comeback era folders"
on public.comeback_era_memory_folders for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.user_id = (select auth.uid())
      and e.type = 'COMEBACK'
  )
  and exists (
    select 1 from public.memory_folders f
    where f.id = folder_id
      and f.user_id = (select auth.uid())
  )
);

create policy "Users can delete own comeback era folders"
on public.comeback_era_memory_folders for delete to authenticated
using ((select auth.uid()) = user_id);

create index comeback_era_memory_folders_folder_idx
on public.comeback_era_memory_folders (folder_id);

comment on table public.comeback_era_memory_folders is
'Lightweight ownership-safe link between a Comeback event and its Memory Folder. Comeback Diary content remains canonical in comeback_diaries.';
