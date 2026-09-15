-- Cloud-backed archaeology collections for IdolDays.
create table if not exists public.archaeology_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idol_id uuid references public.idols(id) on delete set null,
  url text not null,
  title text not null default '',
  image_url text not null default '',
  source text not null default 'WEB'
    check (source in ('THREADS','X','YOUTUBE','TIKTOK','INSTAGRAM','WEB')),
  collection text not null default '',
  tags text[] not null default '{}',
  note text not null default '',
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.archaeology_items enable row level security;

drop policy if exists "Users can read own archaeology" on public.archaeology_items;
create policy "Users can read own archaeology"
on public.archaeology_items for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own archaeology" on public.archaeology_items;
create policy "Users can insert own archaeology"
on public.archaeology_items for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own archaeology" on public.archaeology_items;
create policy "Users can update own archaeology"
on public.archaeology_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own archaeology" on public.archaeology_items;
create policy "Users can delete own archaeology"
on public.archaeology_items for delete
using (auth.uid() = user_id);

create index if not exists archaeology_items_user_created_idx
on public.archaeology_items (user_id, created_at desc);

create index if not exists archaeology_items_idol_idx
on public.archaeology_items (idol_id);
