import { NextResponse } from "next/server";
import { getOutstandingPenaltiesAll, settlePenalty } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Seznam nevyrovnaných pokut — jen pro admin.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  const penalties = await getOutstandingPenaltiesAll();
  return NextResponse.json({ penalties });
}

// Označit pokutu za vyrovnanou (barber ji vybral v hotovosti).
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Chybí id pokuty." }, { status: 400 });
  }
  await settlePenalty(String(id));
  return NextResponse.json({ ok: true });
}
