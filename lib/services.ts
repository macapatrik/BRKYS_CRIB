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
    price: 700,
    duration: 45,
    description: "konzultace · vlastní střih · finální styling",
  },
  {
    id: "detsky-strih",
    label: "Dětský střih (5–13 let)",
    price: 600,
    duration: 45,
    description: "konzultace · vlastní střih · finální styling",
  },
  {
    id: "vousy",
    label: "Úprava vousů / holení",
    price: 700,
    duration: 45,
    description: "konzultace · úprava vousů / holení · finální styling",
  },
  {
    id: "komplet",
    label: "Komplet",
    price: 1100,
    duration: 75,
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
