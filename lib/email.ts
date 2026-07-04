import { Resend } from "resend";
import type { Booking } from "./types";
import { serviceLabel } from "./services";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM ?? "BRKYS CRIB <onboarding@resend.dev>";
const BARBER_EMAIL = process.env.BARBER_EMAIL ?? "";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

const resend = apiKey ? new Resend(apiKey) : null;

function fmtDate(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  return d.toLocaleString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function send(to: string, subject: string, html: string) {
  if (!resend || !to) {
    console.log(
      `[email] Přeskočeno (chybí RESEND_API_KEY nebo příjemce). Předmět: ${subject}`,
    );
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] Odeslání selhalo:", err);
  }
}

const wrap = (title: string, rows: [string, string][], footer = "") => `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#0f0f10;color:#f4f4f5;padding:32px;border-radius:12px">
    <h2 style="margin:0 0 20px;letter-spacing:1px;text-transform:uppercase;font-size:18px">${title}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;color:#9a9a9f;width:120px">${k}</td><td style="padding:8px 0;color:#f4f4f5">${v}</td></tr>`,
        )
        .join("")}
    </table>
    ${footer}
  </div>`;

export async function notifyNewBooking(b: Booking) {
  // barberovi
  await send(
    BARBER_EMAIL,
    `Nová rezervace – ${fmtDate(b.date, b.time)}`,
    wrap("Nová rezervace", [
      ["Kód", b.id],
      ["Termín", fmtDate(b.date, b.time)],
      ["Služba", serviceLabel(b.service)],
      ["Jméno", esc(b.name)],
      ["Telefon", esc(b.phone)],
      ["Email", esc(b.email)],
    ]),
  );
  // zákazníkovi
  await send(
    b.email,
    `Potvrzení rezervace ${b.id} – BRKYS CRIB`,
    wrap(
      "Rezervace potvrzena",
      [
        ["Kód", b.id],
        ["Termín", fmtDate(b.date, b.time)],
        ["Služba", serviceLabel(b.service)],
        ["Jméno", esc(b.name)],
      ],
      `<p style="margin:24px 0 0;font-size:13px;color:#9a9a9f">
        Potřebuješ zrušit? Použij svůj kód na
        <a href="${APP_URL}/zrusit" style="color:#c8a35b">${APP_URL}/zrusit</a>.
      </p>`,
    ),
  );
}

export async function notifyCancellation(b: Booking) {
  // barberovi
  await send(
    BARBER_EMAIL,
    `Zrušená rezervace – ${fmtDate(b.date, b.time)}`,
    wrap("Zrušená rezervace", [
      ["Kód", b.id],
      ["Termín", fmtDate(b.date, b.time)],
      ["Jméno", esc(b.name)],
      ["Telefon", esc(b.phone)],
      ["Důvod", esc(b.cancelReason ?? "—")],
    ]),
  );
  // zákazníkovi
  await send(
    b.email,
    `Rezervace ${b.id} zrušena – BRKYS CRIB`,
    wrap(
      "Rezervace zrušena",
      [
        ["Kód", b.id],
        ["Termín", fmtDate(b.date, b.time)],
      ],
      `<p style="margin:24px 0 0;font-size:13px;color:#9a9a9f">
        Chceš nový termín?
        <a href="${APP_URL}/rezervace" style="color:#c8a35b">${APP_URL}/rezervace</a>
      </p>`,
    ),
  );
}
