"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Přihlášení se nezdařilo.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-24">
      <h1 className="font-display text-5xl tracking-wide">Správa</h1>
      <p className="mt-3 mb-10 text-muted">Přihlas se heslem barbera.</p>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          className="w-full rounded-lg border border-border bg-elevated px-4 py-3 text-fg placeholder:text-muted/60 outline-none focus:border-accent"
          placeholder="Heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-accent px-6 py-3 font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Přihlašuji…" : "Přihlásit"}
        </button>
      </form>
    </main>
  );
}
