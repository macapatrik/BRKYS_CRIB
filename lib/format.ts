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
