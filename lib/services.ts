export type Service = {
  id: string;
  label: string;
  price: number; // Kč
  duration: number; // min, orientační
};

export const SERVICES: Service[] = [
  { id: "classic", label: "Pánský střih", price: 400, duration: 30 },
  { id: "fade", label: "Fade / mašinka", price: 450, duration: 40 },
  { id: "cut-beard", label: "Střih + úprava vousů", price: 600, duration: 50 },
  { id: "beard", label: "Úprava vousů", price: 250, duration: 20 },
  { id: "kids", label: "Dětský střih", price: 300, duration: 25 },
];

export function serviceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function serviceLabel(id: string): string {
  return serviceById(id)?.label ?? id;
}
