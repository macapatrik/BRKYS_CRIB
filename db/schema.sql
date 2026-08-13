-- BRKYS CRIB — schéma rezervační databáze (Postgres)
-- Nasazení na čistou databázi (Neon / Supabase / jakýkoli Postgres):
--   psql "<DATABASE_URL>" -f db/schema.sql

create table if not exists slots (
  id        uuid primary key default gen_random_uuid(),
  date      date not null,
  time      text not null,               -- "HH:mm"
  available boolean not null default true,
  unique (date, time)                    -- brání duplicitnímu termínu
);

create table if not exists bookings (
  id           text primary key,         -- ref. kód, např. BRK-7F3K9Q
  slot_id      uuid not null references slots(id),
  date         date not null,
  time         text not null,
  name         text not null,
  phone        text not null,
  email        text not null,
  service      text not null,            -- id služby
  status       text not null default 'confirmed'
                 check (status in ('confirmed', 'cancelled')),
  cancel_reason text,
  created_at   timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists bookings_created_at_idx on bookings (created_at desc);
