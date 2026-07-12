import { getBookings } from "@/lib/db";
import { serviceById, serviceLabel } from "@/lib/services";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

// Escapování textu podle RFC 5545
function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// "YYYY-MM-DD" + "HH:mm" (+ minuty) → "YYYYMMDDTHHMMSS" (lokální čas pro TZID)
function localStamp(date: string, time: string, addMinutes = 0): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  // aritmetika v UTC, ať minuty korektně přetečou přes hodinu/den; formátujeme wall-clock
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi) + addMinutes * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}` +
    `T${p(t.getUTCHours())}${p(t.getUTCMinutes())}00`
  );
}

function utcStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
}

function event(b: Booking): string {
  const dur = serviceById(b.service)?.duration ?? 45;
  return [
    "BEGIN:VEVENT",
    `UID:${b.id}@brkys-crib`,
    `DTSTAMP:${utcStamp(b.createdAt)}`,
    `DTSTART;TZID=Europe/Prague:${localStamp(b.date, b.time)}`,
    `DTEND;TZID=Europe/Prague:${localStamp(b.date, b.time, dur)}`,
    `SUMMARY:${esc(`${serviceLabel(b.service)} — ${b.name}`)}`,
    `DESCRIPTION:${esc(`Kód: ${b.id}\nTelefon: ${b.phone}\nEmail: ${b.email}`)}`,
    "END:VEVENT",
  ].join("\r\n");
}

// Statická definice zóny Europe/Prague (SEČ/SELČ)
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Prague",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!process.env.CALENDAR_TOKEN || key !== process.env.CALENDAR_TOKEN) {
    return new Response("Neplatný nebo chybějící klíč.", { status: 401 });
  }

  const bookings = (await getBookings()).filter(
    (b) => b.status === "confirmed",
  );

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BRKYS CRIB//Rezervace//CS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:BRKYS CRIB — Rezervace",
    "X-WR-TIMEZONE:Europe/Prague",
    VTIMEZONE,
    ...bookings.map(event),
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="brkys-crib.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
