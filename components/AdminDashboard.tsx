"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDay, normalizePhone } from "@/lib/format";
import { serviceLabel, type Service } from "@/lib/services";
import type { Booking, Penalty, Slot } from "@/lib/types";

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Popisky dnů v týdnu — index = Date.getDay() (0 = neděle)
const WEEKDAYS = [
  { d: 1, label: "Po" },
  { d: 2, label: "Út" },
  { d: 3, label: "St" },
  { d: 4, label: "Čt" },
  { d: 5, label: "Pá" },
  { d: 6, label: "So" },
  { d: 0, label: "Ne" },
];

const pad2 = (n: number) => String(n).padStart(2, "0");
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;

type DayGroup = { date: string; slots: Slot[] };

export default function AdminDashboard() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Rušení rezervace (inline formulář s důvodem)
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // Hromadné přidání termínů (týdenní šablona)
  const [bulkFrom, setBulkFrom] = useState("");
  const [bulkTo, setBulkTo] = useState("");
  const [bulkStart, setBulkStart] = useState("09:00");
  const [bulkEnd, setBulkEnd] = useState("17:00");
  const [bulkInterval, setBulkInterval] = useState("30");
  const [bulkDays, setBulkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  async function load() {
    const [s, b, sv, p] = await Promise.all([
      fetch("/api/slots?all=1", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/bookings", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/services", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/penalties", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setSlots(s.slots ?? []);
    setBookings(b.bookings ?? []);
    setPenalties(p.penalties ?? []);
    const list: Service[] = sv.services ?? [];
    setServices(list);
    setPriceEdits(
      Object.fromEntries(list.map((x) => [x.id, String(x.price)])),
    );
  }

  async function savePrice(id: string) {
    const value = Number(priceEdits[id]);
    if (!Number.isInteger(value) || value < 0) {
      setError("Cena musí být celé číslo ≥ 0.");
      return;
    }
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, price: value }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Chyba.");
      return;
    }
    setError(null);
    setSavedId(id);
    load();
  }

  useEffect(() => {
    load();
  }, []);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Chyba.");
      return;
    }
    setTime("");
    load();
  }

  async function deleteSlot(id: string) {
    await fetch(`/api/slots/${id}`, { method: "DELETE" });
    load();
  }

  // Vygeneruje seznam {date,time} podle šablony (rozsah dní × časy)
  function generateBulk(): { date: string; time: string }[] {
    if (!bulkFrom || !bulkTo) return [];
    const startM = toMin(bulkStart);
    const endM = toMin(bulkEnd);
    const step = Number(bulkInterval);
    if (!Number.isInteger(step) || step <= 0 || endM <= startM) return [];
    const out: { date: string; time: string }[] = [];
    const from = new Date(`${bulkFrom}T12:00:00`);
    const to = new Date(`${bulkTo}T12:00:00`);
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      if (!bulkDays.includes(d.getDay())) continue;
      const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      for (let m = startM; m < endM; m += step) {
        out.push({ date: dateStr, time: fromMin(m) });
      }
    }
    return out;
  }

  const bulkPreview = generateBulk();

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    setBulkMsg(null);
    const items = generateBulk();
    if (!items.length) {
      setBulkMsg("Zkontroluj rozsah dní, časy a vybrané dny.");
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/slots/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const d = await res.json();
      if (!res.ok) {
        setBulkMsg(d.error ?? "Chyba.");
        return;
      }
      setBulkMsg(
        `Přidáno ${d.added} termínů${d.skipped ? `, ${d.skipped} už existovalo` : ""}.`,
      );
      load();
    } finally {
      setBulkBusy(false);
    }
  }

  async function cancelBooking(id: string) {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reason: reason.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Zrušení se nezdařilo.");
        return;
      }
      setCancelId(null);
      setReason("");
      setError(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function settlePenalty(id: string) {
    setBusy(true);
    try {
      await fetch("/api/penalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  // Rezervace podle slotu (jen potvrzené) — pro obsazenost termínů
  const bookingBySlot = useMemo(() => {
    const m = new Map<string, Booking>();
    for (const b of bookings) {
      if (b.status === "confirmed") m.set(b.slotId, b);
    }
    return m;
  }, [bookings]);

  // Součet nevyrovnaných pokut podle (normalizovaného) telefonu klienta.
  const penaltyByPhone = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of penalties) {
      m.set(p.phone, (m.get(p.phone) ?? 0) + p.amount);
    }
    return m;
  }, [penalties]);

  // Jméno klienta k pokutě dohledáme přes rezervaci, která ji způsobila.
  const nameByBookingId = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of bookings) m.set(b.id, b.name);
    return m;
  }, [bookings]);

  const { upcoming, archive } = useMemo(() => {
    const today = todayStr();
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    const days: DayGroup[] = [...map.entries()]
      .map(([date, arr]) => ({
        date,
        slots: arr.sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      upcoming: days.filter((d) => d.date >= today),
      archive: days.filter((d) => d.date < today).reverse(),
    };
  }, [slots]);

  const cancelled = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "cancelled")
        .sort((a, b) => (b.cancelledAt ?? "").localeCompare(a.cancelledAt ?? "")),
    [bookings],
  );

  const fieldCls =
    "rounded-lg border border-border bg-elevated px-4 py-2.5 text-fg outline-none focus:border-accent";

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  const confirmedCount = bookingBySlot.size;

  function renderDay(d: DayGroup) {
    return (
      <div key={d.date} className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-4 font-display text-2xl capitalize tracking-wide">
          {formatDay(d.date)}
        </p>
        <div className="space-y-2">
          {d.slots.map((s) => {
            const b = bookingBySlot.get(s.id);
            const isCanceling = cancelId === b?.id;
            const due = b ? penaltyByPhone.get(normalizePhone(b.phone)) ?? 0 : 0;
            return (
              <div
                key={s.id}
                className={`rounded-xl border px-4 py-3 ${
                  b
                    ? "border-accent bg-elevated"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl tracking-wide text-accent">
                      {s.time}
                    </span>
                    {b ? (
                      <span className="text-fg">
                        {b.name}{" "}
                        <span className="text-muted">
                          · {serviceLabel(b.service)}
                        </span>
                        {due > 0 ? (
                          <span
                            className="ml-2 inline-block rounded-full border border-red-800/30 bg-red-800/[0.08] px-2 py-0.5 text-xs font-medium text-red-800"
                            title="Nevyrovnaná pokuta za pozdní zrušení — vyber v hotovosti"
                          >
                            ⚠️ pokuta {due} Kč
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">volný</span>
                    )}
                  </div>
                  {b ? (
                    <button
                      onClick={() => {
                        setCancelId(isCanceling ? null : b.id);
                        setReason("");
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-red-800/40 hover:text-red-800"
                    >
                      {isCanceling ? "Zpět" : "Zrušit rezervaci"}
                    </button>
                  ) : (
                    <button
                      onClick={() => deleteSlot(s.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-red-800/40 hover:text-red-800"
                      title="Smazat volný termín"
                    >
                      Smazat termín
                    </button>
                  )}
                </div>

                {b && (
                  <div className="mt-1 text-sm text-muted">
                    <span className="font-mono tracking-wider text-accent/80">
                      {b.id}
                    </span>{" "}
                    · {b.phone} · {b.email}
                  </div>
                )}

                {b && isCanceling && (
                  <div className="mt-3 rounded-lg border border-border bg-surface p-3">
                    <label className="mb-2 block text-xs uppercase tracking-widest text-muted">
                      Důvod zrušení — pošle se zákazníkovi e-mailem
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder="Např. Musím termín bohužel zrušit kvůli nemoci. Ozvi se pro náhradní."
                      className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={busy || !reason.trim()}
                        className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-40"
                      >
                        {busy ? "Ruším…" : "Zrušit a poslat e-mail"}
                      </button>
                      <span className="text-xs text-muted">
                        Termín se poté uvolní.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-5xl tracking-wide">Správa</h1>
        <button
          onClick={logout}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-fg"
        >
          Odhlásit
        </button>
      </div>
      <p className="mt-2 mb-10 text-muted">
        {upcoming.length} dní s termíny · {confirmedCount} aktivních rezervací
      </p>

      {/* Přidat termín */}
      <section className="mb-12 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          Přidat volný termín
        </h2>
        <form onSubmit={addSlot} className="flex flex-wrap items-end gap-3">
          <input
            type="date"
            className={fieldCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            type="time"
            className={fieldCls}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-fg hover:opacity-90"
          >
            Přidat
          </button>
          {error && <span className="text-sm text-red-800">{error}</span>}
        </form>
      </section>

      {/* Hromadné termíny */}
      <section className="mb-12 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-sm uppercase tracking-widest text-muted">
          Hromadné termíny
        </h2>
        <p className="mb-4 text-sm text-muted">
          Vygeneruj termíny na víc dní najednou. Už existující se přeskočí.
        </p>
        <form onSubmit={submitBulk} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-muted">
              Od dne
              <input
                type="date"
                className={fieldCls}
                value={bulkFrom}
                onChange={(e) => setBulkFrom(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-muted">
              Do dne
              <input
                type="date"
                className={fieldCls}
                value={bulkTo}
                onChange={(e) => setBulkTo(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-muted">
              Od času
              <input
                type="time"
                className={fieldCls}
                value={bulkStart}
                onChange={(e) => setBulkStart(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-muted">
              Do času
              <input
                type="time"
                className={fieldCls}
                value={bulkEnd}
                onChange={(e) => setBulkEnd(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-muted">
              Po kolika min
              <input
                type="number"
                min={5}
                step={5}
                inputMode="numeric"
                className={`${fieldCls} w-28`}
                value={bulkInterval}
                onChange={(e) => setBulkInterval(e.target.value)}
                required
              />
            </label>
          </div>

          <div>
            <span className="mb-2 block text-xs uppercase tracking-widest text-muted">
              Dny v týdnu
            </span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w) => {
                const on = bulkDays.includes(w.d);
                return (
                  <button
                    key={w.d}
                    type="button"
                    onClick={() =>
                      setBulkDays((prev) =>
                        prev.includes(w.d)
                          ? prev.filter((x) => x !== w.d)
                          : [...prev, w.d],
                      )
                    }
                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                      on
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-border bg-elevated text-muted hover:border-accent"
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={bulkBusy || bulkPreview.length === 0}
              className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-fg hover:opacity-90 disabled:opacity-40"
            >
              {bulkBusy
                ? "Přidávám…"
                : `Vygenerovat ${bulkPreview.length} termínů`}
            </button>
            {bulkMsg && <span className="text-sm text-muted">{bulkMsg}</span>}
          </div>
        </form>
      </section>

      {/* Ceník */}
      <section className="mb-12 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          Ceník
        </h2>
        <div className="space-y-2">
          {services.map((s) => {
            const current = priceEdits[s.id] ?? String(s.price);
            const changed = current !== String(s.price);
            const invalid =
              current.trim() === "" || !Number.isInteger(Number(current)) ||
              Number(current) < 0;
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-4 py-3"
              >
                <span className="text-fg">{s.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={current}
                    onChange={(e) => {
                      setPriceEdits((p) => ({ ...p, [s.id]: e.target.value }));
                      setSavedId(null);
                    }}
                    className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-right text-fg outline-none focus:border-accent"
                  />
                  <span className="text-muted">Kč</span>
                  {changed ? (
                    <button
                      onClick={() => savePrice(s.id)}
                      disabled={invalid}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-40"
                    >
                      Uložit
                    </button>
                  ) : savedId === s.id ? (
                    <span className="px-2 text-sm text-accent">Uloženo ✓</span>
                  ) : (
                    <span className="w-[68px]" aria-hidden />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pokuty k vybrání */}
      {penalties.length > 0 && (
        <section className="mb-12 rounded-2xl border border-red-800/25 bg-red-800/[0.04] p-6">
          <h2 className="mb-1 text-sm uppercase tracking-widest text-red-800">
            Pokuty k vybrání ({penalties.length})
          </h2>
          <p className="mb-4 text-sm text-muted">
            Pozdní zrušení (do 24 h před termínem). Vyber v hotovosti při příští
            návštěvě a označ jako vyrovnané.
          </p>
          <div className="space-y-2">
            {penalties.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-4 py-3"
              >
                <div>
                  <span className="text-fg">
                    {(p.bookingId && nameByBookingId.get(p.bookingId)) ??
                      "Klient"}
                  </span>{" "}
                  <span className="text-muted">· {p.phone}</span>
                  <div className="mt-0.5 text-xs text-muted">
                    {p.reason ?? "Pozdní zrušení"} · {formatDay(p.createdAt.slice(0, 10))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl tracking-wide text-red-800">
                    {p.amount} Kč
                  </span>
                  <button
                    onClick={() => settlePenalty(p.id)}
                    disabled={busy}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-fg disabled:opacity-40"
                  >
                    Vyrovnáno
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Nadcházející */}
      <section className="mb-12">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          Nadcházející termíny
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-muted">Žádné nadcházející termíny.</p>
        ) : (
          <div className="space-y-4">{upcoming.map(renderDay)}</div>
        )}
      </section>

      {/* Archiv */}
      {archive.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
            Archiv
          </h2>
          <div className="space-y-4 opacity-70">{archive.map(renderDay)}</div>
        </section>
      )}

      {/* Historie zrušení */}
      {cancelled.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
            Historie zrušení ({cancelled.length})
          </h2>
          <div className="space-y-2">
            {cancelled.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-border/50 bg-surface/50 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono tracking-wider text-muted">
                    {b.id}
                  </span>
                  <span className="text-muted">
                    {formatDay(b.date)} · {b.time}
                  </span>
                </div>
                <div className="mt-1 text-fg/80">
                  {b.name} · {serviceLabel(b.service)}
                </div>
                <div className="mt-1 text-red-800/80">
                  Zrušeno — {b.cancelReason}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
