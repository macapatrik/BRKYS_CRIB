import { serviceById, serviceLabel } from "./services";
import type { Booking } from "./types";

// Escapování textu podle RFC 5545
function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// "YYYY-MM-DD" + "HH:mm" (+ minuty) → "YYYYMMDDTHHMMSS" (wall-clock pro TZID)
function localStamp(date: string, time: string, addMinutes = 0): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
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

// Jednoudálostní kalendář (.ics) pro zákazníka — příloha do potvrzovacího
// a připomínacího e-mailu, ať si termín jedním klikem přidá do svého telefonu.
export function bookingIcs(b: Booking): string {
  const dur = serviceById(b.service)?.duration ?? 45;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BRKYS CRIB//Rezervace//CS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${b.id}@brkys-crib`,
    `DTSTAMP:${utcStamp(b.createdAt)}`,
    `DTSTART;TZID=Europe/Prague:${localStamp(b.date, b.time)}`,
    `DTEND;TZID=Europe/Prague:${localStamp(b.date, b.time, dur)}`,
    `SUMMARY:${esc(`BRKYS CRIB — ${serviceLabel(b.service)}`)}`,
    `DESCRIPTION:${esc(`Rezervace ${b.id}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
