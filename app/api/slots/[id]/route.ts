import { NextResponse } from "next/server";
import { removeSlot } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/slots/[id]">,
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  const { id } = await ctx.params;
  await removeSlot(id);
  return NextResponse.json({ ok: true });
}
