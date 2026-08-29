"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SERVICES } from "@/lib/services";
import { formatDay } from "@/lib/format";
import type { Slot, Booking } from "@/lib/types";

export default function BookingForm() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState(SERVICES);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(SERVICES[0].id);
  const [slotId, setSlotId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Booking | null>(null);
  const [penaltyDue, setPenaltyDue] = useState(0);

  async function loadSlots() {
    setLoading(true);
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      const data = await res.json();
      setSlots(data.slots ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
    // aktuální ceny z DB (fallback na výchozí z kódu)
    fetch("/api/services", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.services) && d.services.length) setServices(d.services);
      })
      .catch(() => {});
  }, []);

  // Předvybrat službu podle ?service= z URL (odkaz z ceníku)
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("service");
    if (wanted && SERVICES.some((s) => s.id === wanted)) {
      setService(wanted);
    }
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return [...map.entries()];
  }, [slots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slotId) {
      setError("Vyber prosím termín.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, name, phone, email, service }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rezervace se nezdařila.");
      setPenaltyDue(data.penaltyDue ?? 0);
      setDone(data.booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba.");
      // termín se mohl mezitím obsadit — obnovit
      loadSlots();
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-accent bg-elevated p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-accent">
          Rezervace potvrzena
        </p>
        <p className="mt-4 text-muted">
          Tvůj kód rezervace — ulož si ho pro případné zrušení:
        </p>
        <p className="mt-2 font-display text-4xl tracking-widest text-fg">
          {done.id}
        </p>
        <p className="mt-6 text-fg">
          {formatDay(done.date)} v {done.time}
        </p>
        {penaltyDue > 0 ? (
          <p className="mx-auto mt-6 max-w-sm rounded-xl border border-red-800/25 bg-red-800/[0.06] px-4 py-3 text-sm text-red-800">
            ⚠️ Z minulého pozdního zrušení ti zbývá pokuta{" "}
            <strong>{penaltyDue} Kč</strong> — připočteme ji k tomuto střihu
            (platba na místě).
          </p>
        ) : null}
        <Link
          href="/zrusit"
          className="mt-8 inline-block text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Potřebuješ zrušit? →
        </Link>
      </div>
    );
  }

  const fieldCls =
    "w-full rounded-lg border border-border bg-elevated px-4 py-3 text-fg placeholder:text-muted/60 outline-none focus:border-accent transition-colors";

  return (
    <form onSubmit={submit} className="space-y-10">
      {/* Služba */}
      <fieldset>
        <legend className="mb-4 text-sm uppercase tracking-widest text-muted">
          1 · Vyber službu
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                service === s.id
                  ? "border-accent bg-elevated ring-1 ring-accent"
                  : "border-border bg-surface hover:border-muted"
              }`}
            >
              <span>
                <input
                  type="radio"
                  name="service"
                  value={s.id}
                  checked={service === s.id}
                  onChange={() => setService(s.id)}
                  className="sr-only"
                />
                <span className="block text-fg">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {s.description}
                </span>
                <span className="text-xs text-muted">{s.duration} min</span>
              </span>
              <span className="whitespace-nowrap font-display text-xl tracking-wide text-accent">
                {s.price} Kč
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Termín */}
      <fieldset>
        <legend className="mb-4 text-sm uppercase tracking-widest text-muted">
          2 · Vyber termín
        </legend>
        {loading ? (
          <p className="text-muted">Načítám volné termíny…</p>
        ) : grouped.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-muted">
            Momentálně nejsou volné žádné termíny. Zkus to prosím později.
          </p>
        ) : (
          <div className="space-y-5">
            {grouped.map(([date, daySlots]) => (
              <div key={date}>
                <p className="mb-2 text-sm capitalize text-muted">
                  {formatDay(date)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlotId(s.id)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                        slotId === s.id
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border bg-surface text-fg hover:border-accent"
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {/* Kontakt */}
      <fieldset>
        <legend className="mb-4 text-sm uppercase tracking-widest text-muted">
          3 · Tvoje údaje
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={fieldCls}
            placeholder="Jméno a příjmení"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={fieldCls}
            placeholder="Telefon"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            className={`${fieldCls} sm:col-span-2`}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </fieldset>

      {error && (
        <p className="rounded-lg border border-red-800/25 bg-red-800/[0.06] px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-accent px-6 py-4 font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Odesílám…" : "Rezervovat termín"}
      </button>
    </form>
  );
}
