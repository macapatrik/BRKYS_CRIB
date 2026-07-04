"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { serviceLabel } from "@/lib/services";
import type { Booking, Slot } from "@/lib/types";

export default function AdminDashboard() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [s, b] = await Promise.all([
      fetch("/api/slots?all=1", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/bookings", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setSlots(s.slots ?? []);
    setBookings(b.bookings ?? []);
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

  const fieldCls =
    "rounded-lg border border-border bg-elevated px-4 py-2.5 text-fg outline-none focus:border-accent";

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-5xl tracking-wide">Správa</h1>
        <button
          onClick={logout}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-fg"
        >
          Odhlásit
        </button>
      </div>
      <p className="mt-2 mb-10 text-muted">Termíny a rezervace BRKYS CRIB.</p>

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
          {error && <span className="text-sm text-red-300">{error}</span>}
        </form>
      </section>

      {/* Termíny */}
      <section className="mb-12">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          Termíny ({slots.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {slots.length === 0 && (
            <p className="text-muted">Zatím žádné termíny.</p>
          )}
          {slots.map((s) => (
            <span
              key={s.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                s.available
                  ? "border-border bg-surface text-fg"
                  : "border-accent/30 bg-accent/5 text-muted line-through"
              }`}
            >
              {formatDateTime(s.date, s.time)}
              <button
                onClick={() => deleteSlot(s.id)}
                className="text-muted hover:text-red-400"
                title="Smazat termín"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Rezervace */}
      <section>
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          Rezervace ({bookings.length})
        </h2>
        <div className="space-y-2">
          {bookings.length === 0 && (
            <p className="text-muted">Zatím žádné rezervace.</p>
          )}
          {bookings.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border p-4 ${
                b.status === "cancelled"
                  ? "border-border/50 bg-surface/50 opacity-60"
                  : "border-border bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm tracking-wider text-accent">
                  {b.id}
                </span>
                <span className="text-sm text-muted">
                  {formatDateTime(b.date, b.time)}
                </span>
              </div>
              <div className="mt-2 text-fg">
                {b.name} · {serviceLabel(b.service)}
              </div>
              <div className="text-sm text-muted">
                {b.phone} · {b.email}
              </div>
              {b.status === "cancelled" && (
                <div className="mt-2 text-sm text-red-300">
                  Zrušeno — {b.cancelReason}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
