import { NextResponse } from "next/server";
import { addSlot, getAvailableSlots, getSlots } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const all = new URL(request.url).searchParams.get("all") === "1";
  if (all && !(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  const slots = all ? await getSlots() : await getAvailableSlots();
  return NextResponse.json({ slots });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  try {
    const { date, time } = await request.json();
    if (!date || !time) {
      return NextResponse.json(
        { error: "Datum i čas jsou povinné." },
        { status: 400 },
      );
    }
    const slot = await addSlot(date, time);
    return NextResponse.json({ slot }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chyba." },
      { status: 400 },
    );
  }
}
