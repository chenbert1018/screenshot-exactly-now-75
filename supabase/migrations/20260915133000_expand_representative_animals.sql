-- Expand IdolDays representative animals with common K-pop animal types.
-- Keep LION for the lion / beast type and preserve all existing selections.
alter table public.idols
  drop constraint if exists idols_representative_animal_check;

alter table public.idols
  add constraint idols_representative_animal_check
  check (
    representative_animal in (
      'CAT',
      'DOG',
      'RABBIT',
      'FOX',
      'HAMSTER',
      'TIGER',
      'LION',
      'DEER',
      'CHIPMUNK',
      'PENGUIN',
      'WOLF'
    )
  );
