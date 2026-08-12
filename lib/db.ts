import postgres from "postgres";
import crypto from "crypto";
import type { Booking, Slot } from "./types";

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

export async function cancelBooking(
  id: string,
  reason: string,
): Promise<Booking> {
  return await sql.begin(async (tx) => {
    const [existing] = await tx`
      select slot_id, status from bookings where id = ${id}
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
    return toBooking(row as unknown as BookingRow);
  });
}
