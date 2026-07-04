import { NextResponse } from "next/server";
import { createBooking, getBookings } from "@/lib/db";
import { notifyNewBooking } from "@/lib/email";
import { serviceById } from "@/lib/services";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  const bookings = await getBookings();
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slotId, name, phone, email, service } = body ?? {};

    if (!slotId || !name || !phone || !email || !service) {
      return NextResponse.json(
        { error: "Vyplň prosím všechna pole." },
        { status: 400 },
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Neplatný email." },
        { status: 400 },
      );
    }
    if (!serviceById(service)) {
      return NextResponse.json({ error: "Neplatná služba." }, { status: 400 });
    }

    const booking = await createBooking({
      slotId,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      service,
    });

    await notifyNewBooking(booking);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chyba." },
      { status: 400 },
    );
  }
}
