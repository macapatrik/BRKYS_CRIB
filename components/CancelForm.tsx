"use client";

import { useState } from "react";
import Link from "next/link";

export default function CancelForm() {
  const [id, setId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [penalty, setPenalty] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Zrušení se nezdařilo.");
      setPenalty(data.penalty ?? null);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-accent">
          Rezervace zrušena
        </p>
        <p className="mt-4 text-muted">
          Termín jsme uvolnili. Děkujeme, že jsi dal{" "}vědět.
        </p>
        {penalty ? (
          <p className="mx-auto mt-5 max-w-sm rounded-xl border border-red-800/25 bg-red-800/[0.06] px-4 py-3 text-sm text-red-800">
            ⚠️ Rušíš míň než 24 h před termínem — k tvému příštímu střihu proto
            připočteme pokutu <strong>{penalty} Kč</strong>.
          </p>
        ) : null}
        <Link
          href="/rezervace"
          className="mt-6 inline-block text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Rezervovat nový termín →
        </Link>
      </div>
    );
  }

  const fieldCls =
    "w-full rounded-lg border border-border bg-elevated px-4 py-3 text-fg placeholder:text-muted/60 outline-none focus:border-accent transition-colors";

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        className={`${fieldCls} font-mono uppercase tracking-widest`}
        placeholder="Kód rezervace (BRK-XXXXXX)"
        value={id}
        onChange={(e) => setId(e.target.value)}
        required
      />
      <textarea
        className={`${fieldCls} min-h-28 resize-none`}
        placeholder="Důvod zrušení"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
      />
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
        {submitting ? "Ruším…" : "Zrušit rezervaci"}
      </button>
    </form>
  );
}
