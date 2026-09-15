-- Persist idol representative animals and homepage cover rotation across devices.
alter table public.idols
  add column if not exists representative_animal text not null default 'DOG'
  check (representative_animal in ('DOG', 'CAT', 'FOX', 'RABBIT', 'WOLF', 'LION'));

alter table public.profiles
  add column if not exists cover_rotation boolean not null default false;

-- Keep existing rows usable and preserve the former DOG fallback.
update public.idols
set representative_animal = 'DOG'
where representative_animal is null;
