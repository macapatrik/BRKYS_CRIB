import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/db";
import { notifyCancellation } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { id, reason } = await request.json();
    if (!id || !reason || !String(reason).trim()) {
      return NextResponse.json(
        { error: "Zadej kód rezervace i důvod zrušení." },
        { status: 400 },
      );
    }
    const booking = await cancelBooking(
      String(id).trim().toUpperCase(),
      String(reason).trim(),
    );
    await notifyCancellation(booking);
    return NextResponse.json({ booking });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chyba." },
      { status: 400 },
    );
  }
}
