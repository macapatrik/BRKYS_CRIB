import { NextResponse } from "next/server";
import { addSlotsBulk } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const MAX_ITEMS = 1000;

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Žádné termíny k přidání." },
        { status: 400 },
      );
    }
    if (items.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: `Najednou lze přidat max. ${MAX_ITEMS} termínů.` },
        { status: 400 },
      );
    }
    const clean: { date: string; time: string }[] = [];
    for (const it of items) {
      const date = String(it?.date ?? "");
      const time = String(it?.time ?? "");
      if (!DATE_RE.test(date) || !TIME_RE.test(time)) {
        return NextResponse.json(
          { error: "Neplatný formát data nebo času." },
          { status: 400 },
        );
      }
      clean.push({ date, time });
    }
    const added = await addSlotsBulk(clean);
    return NextResponse.json({ added, skipped: clean.length - added });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chyba." },
      { status: 400 },
    );
  }
}
