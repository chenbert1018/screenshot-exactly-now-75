alter table public.events
  add column if not exists location_name text not null default '',
  add column if not exists city text not null default '',
  add column if not exists weather_enabled boolean not null default false,
  add column if not exists weather_tone text not null default 'SUNSHINE';

alter table public.events
  drop constraint if exists events_weather_tone_check;

alter table public.events
  add constraint events_weather_tone_check
  check (weather_tone in (
    'SUNSHINE', 'CAT', 'FOX', 'RABBIT', 'HAMSTER', 'TIGER',
    'LION', 'DEER', 'CHIPMUNK', 'PENGUIN', 'WOLF'
  ));
