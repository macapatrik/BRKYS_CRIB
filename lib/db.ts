import postgres from "postgres";
import crypto from "crypto";
import type { Booking, Penalty, Slot } from "./types";
import { SERVICES, type Service } from "./services";
import { normalizePhone } from "./format";

// Pokuta za pozdní zrušení a hranice „pozdního" zrušení.
export const PENALTY_AMOUNT = 200; // Kč
const PENALTY_WINDOW_HOURS = 24;

if (!process.env.DATABASE_URL) {
  throw new Error("Chybí DATABASE_URL v prostředí.");
}

// prepare: false — připojení jde přes Supabase pooler v transaction módu
const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  prepare: false,
});

type BookingRow = {
  id: string;
  slot_id: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  status: Booking["status"];
  cancel_reason: string | null;
  created_at: string;
  cancelled_at: string | null;
};

function toBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    slotId: r.slot_id,
    date: r.date,
    time: r.time,
    name: r.name,
    phone: r.phone,
    email: r.email,
    service: r.service,
    status: r.status,
    cancelReason: r.cancel_reason ?? undefined,
    createdAt: r.created_at,
    cancelledAt: r.cancelled_at ?? undefined,
  };
}

const bookingCols = sql`
  id, slot_id, date::text as date, time, name, phone, email, service,
  status, cancel_reason, created_at::text as created_at, cancelled_at::text as cancelled_at
`;

// Lehký dotaz — drží Supabase (free tier) v aktivním stavu, ať neusne po nečinnosti.
export async function pingDb(): Promise<void> {
  await sql`select 1`;
}

// ---- Slots ----

export async function getSlots(): Promise<Slot[]> {
  return (await sql`
    select id, date::text as date, time, available
    from slots order by date, time
  `) as unknown as Slot[];
}

export async function getAvailableSlots(): Promise<Slot[]> {
  return (await sql`
    select id, date::text as date, time, available
    from slots
    where available
      and (date + time::time) > (now() at time zone 'Europe/Prague')
    order by date, time
  `) as unknown as Slot[];
}

export async function addSlot(date: string, time: string): Promise<Slot> {
  try {
    const [slot] = await sql`
      insert into slots (date, time) values (${date}, ${time})
      returning id, date::text as date, time, available
    `;
    return slot as unknown as Slot;
  } catch (err) {
    if (err instanceof postgres.PostgresError && err.code === "23505") {
      throw new Error("Termín už existuje.");
    }
    throw err;
  }
}

export async function removeSlot(id: string): Promise<void> {
  await sql`delete from slots where id = ${id}`;
}

// Hromadné vložení termínů (týdenní šablona). Duplicitní (date,time) se přeskočí.
// Vrací počet skutečně přidaných termínů.
export async function addSlotsBulk(
  items: { date: string; time: string }[],
): Promise<number> {
  if (!items.length) return 0;
  const rows = await sql`
    insert into slots ${sql(items, "date", "time")}
    on conflict (date, time) do nothing
    returning id
  `;
  return (rows as unknown as unknown[]).length;
}

// ---- Ceny služeb ----

// Přepisy cen z DB (jen ty, co se liší od výchozích v kódu).
export async function getServicePrices(): Promise<Record<string, number>> {
  const rows = (await sql`
    select service_id, price from service_prices
  `) as unknown as { service_id: string; price: number }[];
  const map: Record<string, number> = {};
  for (const r of rows) map[r.service_id] = r.price;
  return map;
}

// Služby z kódu s aktuálními cenami z DB.
export async function getServices(): Promise<Service[]> {
  const prices = await getServicePrices();
  return SERVICES.map((s) =>
    prices[s.id] != null ? { ...s, price: prices[s.id] } : s,
  );
}

export async function setServicePrice(
  id: string,
  price: number,
): Promise<void> {
  await sql`
    insert into service_prices (service_id, price) values (${id}, ${price})
    on conflict (service_id) do update set price = ${price}
  `;
}

// ---- Bookings ----

export async function getBookings(): Promise<Booking[]> {
  const rows = await sql`
    select ${bookingCols} from bookings order by created_at desc
  `;
  return (rows as unknown as BookingRow[]).map(toBooking);
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const rows = await sql`
    select ${bookingCols} from bookings where id = ${id}
  `;
  const row = (rows as unknown as BookingRow[])[0];
  return row ? toBooking(row) : undefined;
}

function makeRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) s += chars[bytes[i] % chars.length];
  return `BRK-${s}`;
}

export async function createBooking(input: {
  slotId: string;
  name: string;
  phone: string;
  email: string;
  service: string;
}): Promise<Booking> {
  return await sql.begin(async (tx) => {
    // atomicky obsadit slot — ochrana proti dvojité rezervaci
    const [slot] = await tx`
      update slots set available = false
      where id = ${input.slotId} and available = true
      returning id, date::text as date, time
    `;
    if (!slot) {
      const [exists] = await tx`select 1 from slots where id = ${input.slotId}`;
      throw new Error(exists ? "Termín už je obsazený." : "Termín neexistuje.");
    }

    const [row] = await tx`
      insert into bookings (id, slot_id, date, time, name, phone, email, service)
      values (${makeRef()}, ${slot.id}, ${slot.date}, ${slot.time},
              ${input.name}, ${input.phone}, ${input.email}, ${input.service})
      returning ${bookingCols}
    `;
    return toBooking(row as unknown as BookingRow);
  });
}

// Rezervace, kterým se má poslat připomínka: potvrzené, zatím bez připomínky,
// termín je v budoucnu a do 32 h. Okno > 24 h zajistí, že denní cron chytí
// každý termín aspoň jednou (den předem).
export async function getDueReminders(): Promise<Booking[]> {
  const rows = await sql`
    select ${bookingCols} from bookings
    where status = 'confirmed'
      and reminder_sent_at is null
      and (date + time::time) > (now() at time zone 'Europe/Prague')
      and (date + time::time) <= (now() at time zone 'Europe/Prague') + interval '32 hours'
    order by date, time
  `;
  return (rows as unknown as BookingRow[]).map(toBooking);
}

export async function markReminderSent(id: string): Promise<void> {
  await sql`update bookings set reminder_sent_at = now() where id = ${id}`;
}

// applyPenalty = true jen když ruší sám klient. Když je termín do 24 h,
// zapíše se pokuta. Barber ruší z adminu s applyPenalty = false (nepokutujeme).
// Vrací i výši případné pokuty (null = žádná).
export async function cancelBooking(
  id: string,
  reason: string,
  applyPenalty = false,
): Promise<{ booking: Booking; penalty: number | null }> {
  return await sql.begin(async (tx) => {
    const [existing] = await tx`
      select slot_id, status, phone,
        (date + time::time) <
          (now() at time zone 'Europe/Prague')
            + make_interval(hours => ${PENALTY_WINDOW_HOURS}) as late
      from bookings where id = ${id}
    `;
    if (!existing) throw new Error("Rezervace nenalezena.");
    if (existing.status === "cancelled")
      throw new Error("Rezervace už je zrušená.");

    const [row] = await tx`
      update bookings
      set status = 'cancelled', cancel_reason = ${reason}, cancelled_at = now()
      where id = ${id}
      returning ${bookingCols}
    `;
    // uvolnit slot zpět
    await tx`update slots set available = true where id = ${existing.slot_id}`;

    let penalty: number | null = null;
    if (applyPenalty && existing.late) {
      await tx`
        insert into penalties (phone, amount, booking_id, reason)
        values (${normalizePhone(existing.phone)}, ${PENALTY_AMOUNT}, ${id},
                ${`Pozdní zrušení ${id}`})
      `;
      penalty = PENALTY_AMOUNT;
    }
    return { booking: toBooking(row as unknown as BookingRow), penalty };
  });
}

// ---- Pokuty ----

type PenaltyRow = {
  id: string;
  phone: string;
  amount: number;
  booking_id: string | null;
  reason: string | null;
  created_at: string;
};

function toPenalty(r: PenaltyRow): Penalty {
  return {
    id: r.id,
    phone: r.phone,
    amount: r.amount,
    bookingId: r.booking_id ?? undefined,
    reason: r.reason ?? undefined,
    createdAt: r.created_at,
  };
}

const penaltyCols = sql`
  id, phone, amount, booking_id, reason, created_at::text as created_at
`;

// Nevyrovnané pokuty konkrétního klienta (dle telefonu).
export async function getOutstandingPenalties(
  phone: string,
): Promise<Penalty[]> {
  const rows = await sql`
    select ${penaltyCols} from penalties
    where phone = ${normalizePhone(phone)} and settled_at is null
    order by created_at
  `;
  return (rows as unknown as PenaltyRow[]).map(toPenalty);
}

// Všechny nevyrovnané pokuty — pro admin.
export async function getOutstandingPenaltiesAll(): Promise<Penalty[]> {
  const rows = await sql`
    select ${penaltyCols} from penalties
    where settled_at is null
    order by created_at desc
  `;
  return (rows as unknown as PenaltyRow[]).map(toPenalty);
}

// Barber vybral pokutu v hotovosti → označit za vyrovnané.
export async function settlePenalty(id: string): Promise<void> {
  await sql`update penalties set settled_at = now() where id = ${id}`;
}
