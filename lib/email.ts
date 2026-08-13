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
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`[email] Chyba odeslání „${subject}“ → ${to}:`, error);
    } else {
      console.log(`[email] Odesláno „${subject}“ → ${to} (id: ${data?.id})`);
    }
  } catch (err) {
    console.error("[email] Odeslání selhalo:", err);
  }
}

// Street/neon paleta – sladěno s webem
const C = {
  bg: "#000000",
  card: "#0a0a0a",
  border: "#2b2b2b",
  fg: "#fafafa",
  muted: "#8a8a8a",
  accent: "#c6f24e",
  accentFg: "#0a0a0a",
};

// Limetkové tlačítko (CTA)
const button = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block;background:${C.accent};color:${C.accentFg};text-decoration:none;font-weight:800;text-transform:uppercase;letter-spacing:.5px;font-size:14px;padding:14px 28px;border-radius:999px">${label}</a>`;

const wrap = (title: string, rows: [string, string][], footer = "") => `
  <div style="background:${C.bg};padding:32px 16px">
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;background:${C.card};color:${C.fg};border:1px solid ${C.border};border-radius:16px;overflow:hidden">
      <div style="padding:24px 32px;border-bottom:1px solid ${C.border}">
        <span style="font-size:22px;font-weight:900;letter-spacing:2px;text-transform:uppercase">BRKYS <span style="color:${C.accent}">CRIB</span></span>
      </div>
      <div style="padding:28px 32px">
        <h2 style="margin:0 0 22px;letter-spacing:1.5px;text-transform:uppercase;font-size:15px;color:${C.accent}">${title}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:9px 0;color:${C.muted};width:120px;vertical-align:top">${k}</td><td style="padding:9px 0;color:${C.fg};font-weight:600">${v}</td></tr>`,
            )
            .join("")}
        </table>
        ${footer}
      </div>
    </div>
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
      `<div style="margin:28px 0 4px;text-align:center">${button(`${APP_URL}/zrusit`, "Zrušit rezervaci")}</div>
      <p style="margin:16px 0 0;font-size:13px;color:${C.muted};text-align:center">
        Zrušit můžeš pomocí svého kódu na <a href="${APP_URL}/zrusit" style="color:${C.accent}">${APP_URL}/zrusit</a>.
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
      `<div style="margin:28px 0 4px;text-align:center">${button(`${APP_URL}/rezervace`, "Nový termín")}</div>
      <p style="margin:16px 0 0;font-size:13px;color:${C.muted};text-align:center">
        Chceš nový termín? <a href="${APP_URL}/rezervace" style="color:${C.accent}">${APP_URL}/rezervace</a>
      </p>`,
    ),
  );
}
