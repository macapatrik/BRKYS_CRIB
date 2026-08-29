import { NextResponse } from "next/server";
import { createBooking, getBookings, getOutstandingPenalties } from "@/lib/db";
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

    // Nevyrovnané pokuty klienta (dle telefonu) — připomeneme klientovi i barberovi.
    const outstanding = await getOutstandingPenalties(booking.phone);
    const penaltyDue = outstanding.reduce((sum, p) => sum + p.amount, 0);

    await notifyNewBooking(booking, penaltyDue);
    return NextResponse.json({ booking, penaltyDue }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chyba." },
      { status: 400 },
    );
  }
}
