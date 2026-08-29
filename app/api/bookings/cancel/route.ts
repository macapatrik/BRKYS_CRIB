import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/db";
import { notifyCancellation } from "@/lib/email";
import { isAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { id, reason } = await request.json();
    if (!id || !reason || !String(reason).trim()) {
      return NextResponse.json(
        { error: "Zadej kód rezervace i důvod zrušení." },
        { status: 400 },
      );
    }
    // Barber ruší z adminu → klienta nepokutujeme. Klient ruší sám →
    // pokuta při pozdním zrušení (do 24 h před termínem).
    const applyPenalty = !(await isAdmin());
    const { booking, penalty } = await cancelBooking(
      String(id).trim().toUpperCase(),
      String(reason).trim(),
      applyPenalty,
    );
    await notifyCancellation(booking, penalty);
    return NextResponse.json({ booking, penalty });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chyba." },
      { status: 400 },
    );
  }
}
