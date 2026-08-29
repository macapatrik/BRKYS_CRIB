import { Resend } from "resend";
import type { Booking } from "./types";
import { serviceLabel } from "./services";
import { bookingIcs } from "./ics";

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

type IcsAttachment = { filename: string; ics: string };

async function send(
  to: string,
  subject: string,
  html: string,
  attach?: IcsAttachment,
) {
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
      attachments: attach
        ? [
            {
              filename: attach.filename,
              content: Buffer.from(attach.ics),
              contentType: "text/calendar; charset=utf-8; method=PUBLISH",
            },
          ]
        : undefined,
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

// Krémová/inkoustová paleta z loga – sladěno s webem
const C = {
  bg: "#f3eee5",
  card: "#faf7f1",
  border: "#ddd5c6",
  fg: "#17191a",
  muted: "#7b756b",
  accent: "#17191a",
  accentFg: "#f3eee5",
};

// Inkoustové tlačítko (CTA)
const button = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block;background:${C.accent};color:${C.accentFg};text-decoration:none;text-transform:uppercase;letter-spacing:2px;font-size:13px;padding:14px 28px;border-radius:999px">${label}</a>`;

const wrap = (title: string, rows: [string, string][], footer = "") => `
  <div style="background:${C.bg};padding:32px 16px">
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;background:${C.card};color:${C.fg};border:1px solid ${C.border};border-radius:16px;overflow:hidden">
      <div style="padding:24px 32px;border-bottom:1px solid ${C.border};text-align:center">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:4px;text-transform:uppercase">BRKYS&rsquo; CRIB</span>
      </div>
      <div style="padding:28px 32px">
        <h2 style="margin:0 0 22px;letter-spacing:2px;text-transform:uppercase;font-size:13px;font-weight:600;color:${C.muted}">${title}</h2>
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

export async function notifyNewBooking(b: Booking, penaltyDue = 0) {
  const barberRows: [string, string][] = [
    ["Kód", b.id],
    ["Termín", fmtDate(b.date, b.time)],
    ["Služba", serviceLabel(b.service)],
    ["Jméno", esc(b.name)],
    ["Telefon", esc(b.phone)],
    ["Email", esc(b.email)],
  ];
  if (penaltyDue > 0) {
    barberRows.push([
      "⚠️ Pokuta",
      `${penaltyDue} Kč — nevyrovnaná z dřívějšího pozdního zrušení. Vyber při této návštěvě.`,
    ]);
  }
  // barberovi
  await send(
    BARBER_EMAIL,
    `Nová rezervace – ${fmtDate(b.date, b.time)}`,
    wrap("Nová rezervace", barberRows),
  );

  const penaltyNote =
    penaltyDue > 0
      ? `<div style="margin:24px 0 0;padding:14px 16px;border:1px solid ${C.border};border-radius:12px;background:${C.bg}">
          <p style="margin:0;font-size:13px;color:${C.fg}">
            ⚠️ Z minulého pozdního zrušení ti zbývá <strong>pokuta ${penaltyDue} Kč</strong> — připočteme ji k tomuto střihu (platba na místě).
          </p>
        </div>`
      : "";

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
      `${penaltyNote}
      <div style="margin:28px 0 4px;text-align:center">${button(`${APP_URL}/zrusit`, "Zrušit rezervaci")}</div>
      <p style="margin:16px 0 0;font-size:13px;color:${C.muted};text-align:center">
        📅 V příloze máš soubor <strong>rezervace.ics</strong> — otevři ho a přidáš si termín do kalendáře v telefonu.
      </p>
      <p style="margin:12px 0 0;font-size:13px;color:${C.muted};text-align:center">
        Zrušit můžeš pomocí svého kódu na <a href="${APP_URL}/zrusit" style="color:${C.accent}">${APP_URL}/zrusit</a>.
      </p>`,
    ),
    { filename: "rezervace.ics", ics: bookingIcs(b) },
  );
}

export async function notifyReminder(b: Booking) {
  await send(
    b.email,
    `Připomínka – zítra ${fmtDate(b.date, b.time)} – BRKYS CRIB`,
    wrap(
      "Připomínka termínu",
      [
        ["Kód", b.id],
        ["Termín", fmtDate(b.date, b.time)],
        ["Služba", serviceLabel(b.service)],
      ],
      `<p style="margin:22px 0 0;font-size:14px;color:${C.fg};text-align:center">
        Těšíme se na tebe! 💈
      </p>
      <div style="margin:20px 0 4px;text-align:center">${button(`${APP_URL}/zrusit`, "Nemůžu dorazit — zrušit")}</div>
      <p style="margin:16px 0 0;font-size:13px;color:${C.muted};text-align:center">
        Kdyby ti to nevyšlo, zruš prosím včas na <a href="${APP_URL}/zrusit" style="color:${C.accent}">${APP_URL}/zrusit</a>, ať se termín uvolní pro někoho jiného.
      </p>`,
    ),
    { filename: "rezervace.ics", ics: bookingIcs(b) },
  );
}

export async function notifyCancellation(
  b: Booking,
  penalty: number | null = null,
) {
  const barberRows: [string, string][] = [
    ["Kód", b.id],
    ["Termín", fmtDate(b.date, b.time)],
    ["Jméno", esc(b.name)],
    ["Telefon", esc(b.phone)],
    ["Důvod", esc(b.cancelReason ?? "—")],
  ];
  if (penalty) {
    barberRows.push([
      "⚠️ Pokuta",
      `${penalty} Kč — pozdní zrušení (do 24 h). Vyber při příští návštěvě.`,
    ]);
  }
  // barberovi
  await send(
    BARBER_EMAIL,
    `Zrušená rezervace – ${fmtDate(b.date, b.time)}`,
    wrap("Zrušená rezervace", barberRows),
  );

  const penaltyNote = penalty
    ? `<div style="margin:24px 0 0;padding:14px 16px;border:1px solid ${C.border};border-radius:12px;background:${C.bg}">
        <p style="margin:0;font-size:13px;color:${C.fg}">
          ⚠️ Rušíš míň než 24 h před termínem — k tvému příštímu střihu proto připočteme <strong>pokutu ${penalty} Kč</strong>.
        </p>
      </div>`
    : "";

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
      `${penaltyNote}
      <div style="margin:28px 0 4px;text-align:center">${button(`${APP_URL}/rezervace`, "Nový termín")}</div>
      <p style="margin:16px 0 0;font-size:13px;color:${C.muted};text-align:center">
        Chceš nový termín? <a href="${APP_URL}/rezervace" style="color:${C.accent}">${APP_URL}/rezervace</a>
      </p>`,
    ),
  );
}
