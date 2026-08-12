import { NextResponse } from "next/server";
import { pingDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Denní cron (viz vercel.json) — drží Supabase v aktivním stavu, ať se free-tier
// databáze po týdnu nečinnosti neuspí. Vercel posílá u cronu hlavičku
// `Authorization: Bearer <CRON_SECRET>`, pokud je CRON_SECRET nastavený.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
    }
  }

  try {
    await pingDb();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Chyba." },
      { status: 500 },
    );
  }
}
