import { NextResponse } from "next/server";
import { getDueReminders, markReminderSent } from "@/lib/db";
import { notifyReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

// Denní cron (viz vercel.json) — pošle připomínku zákazníkům, kterým se termín
// blíží (do 32 h). Vercel u cronu posílá `Authorization: Bearer <CRON_SECRET>`.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
    }
  }

  try {
    const due = await getDueReminders();
    let sent = 0;
    for (const b of due) {
      // reminder_sent_at nastavíme před odesláním, ať případný retry cronu
      // neposílá připomínku dvakrát.
      await markReminderSent(b.id);
      await notifyReminder(b);
      sent++;
    }
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Chyba." },
      { status: 500 },
    );
  }
}
