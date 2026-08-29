import { NextResponse } from "next/server";
import { getServices, setServicePrice } from "@/lib/db";
import { serviceById } from "@/lib/services";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = await getServices();
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  try {
    const { id, price } = await request.json();
    if (!id || !serviceById(String(id))) {
      return NextResponse.json({ error: "Neznámá služba." }, { status: 400 });
    }
    const value = Number(price);
    if (!Number.isInteger(value) || value < 0) {
      return NextResponse.json(
        { error: "Cena musí být celé číslo ≥ 0." },
        { status: 400 },
      );
    }
    await setServicePrice(String(id), value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chyba." },
      { status: 400 },
    );
  }
}
