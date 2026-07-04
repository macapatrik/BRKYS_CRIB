import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE = "brkys_admin";

// Token odvozený z hesla — změna hesla zneplatní všechny přihlášené session.
export function adminToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHash("sha256").update(`brkys:${pw}`).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const token = adminToken();
  if (!token) return false;
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  return (
    !!value &&
    value.length === token.length &&
    crypto.timingSafeEqual(Buffer.from(value), Buffer.from(token))
  );
}
