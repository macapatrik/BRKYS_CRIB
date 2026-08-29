export type Service = {
  id: string;
  label: string;
  price: number; // Kč
  duration: number; // min, orientační
  description: string;
};

export const SERVICES: Service[] = [
  {
    id: "strih",
    label: "Střih",
    price: 400,
    duration: 60,
    description: "konzultace · vlastní střih · finální styling",
  },
  {
    id: "vousy",
    label: "Úprava vousů / holení",
    price: 300,
    duration: 20,
    description: "konzultace · úprava vousů / holení · finální styling",
  },
  {
    id: "komplet",
    label: "Komplet",
    price: 600,
    duration: 80,
    description:
      "konzultace · vlastní střih · úprava vousů / holení · finální styling",
  },
];

export function serviceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function serviceLabel(id: string): string {
  return serviceById(id)?.label ?? id;
}
