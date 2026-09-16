alter table public.memories
  add column if not exists photo_position integer not null default 50
  check (photo_position between 0 and 100);

alter table public.idols
  add column if not exists photo_position integer not null default 50
  check (photo_position between 0 and 100);

alter table public.memory_folders
  add column if not exists cover_photo_position integer not null default 50
  check (cover_photo_position between 0 and 100);

alter table public.archaeology_items
  add column if not exists image_position integer not null default 50
  check (image_position between 0 and 100),
  add column if not exists is_manual_cover boolean not null default false;
