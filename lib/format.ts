export function formatDay(date: string): string {
  return new Date(`${date}T00:00`).toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toLocaleString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Normalizace telefonu pro párování stejného klienta napříč rezervacemi:
// necháme jen číslice a bereme posledních 9 (české číslo bez předvolby/mezer).
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
}
