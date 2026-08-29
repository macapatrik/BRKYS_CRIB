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
  cancelled_at timestamptz,
  reminder_sent_at timestamptz            -- kdy byla odeslána připomínka (null = zatím ne)
);

-- Migrace pro existující DB (sloupec přibyl později):
alter table bookings add column if not exists reminder_sent_at timestamptz;

create index if not exists bookings_created_at_idx on bookings (created_at desc);

-- Přepis cen služeb (id + label + trvání zůstávají v kódu, mění se jen cena).
-- Když pro službu záznam není, platí výchozí cena z lib/services.ts.
create table if not exists service_prices (
  service_id text primary key,
  price      integer not null check (price >= 0)
);

-- Pokuty za pozdní zrušení (klient zrušil míň než 24 h před termínem).
-- Vážou se na klienta přes normalizovaný telefon (jen číslice). Barber je
-- vybírá v hotovosti při další návštěvě a poté označí za vyrovnané (settled_at).
create table if not exists penalties (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,               -- normalizovaný telefon klienta
  amount     integer not null default 200 check (amount >= 0),
  booking_id text references bookings(id), -- rezervace, jejíž zrušení pokutu způsobilo
  reason     text,
  created_at timestamptz not null default now(),
  settled_at timestamptz                  -- kdy barber označil za vyrovnané (null = nevyrovnáno)
);

-- Rychlé dohledání nevyrovnaných pokut klienta při rezervaci.
create index if not exists penalties_phone_unsettled_idx
  on penalties (phone) where settled_at is null;
