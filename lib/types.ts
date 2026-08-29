export type Slot = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  available: boolean;
};

export type BookingStatus = "confirmed" | "cancelled";

export type Booking = {
  id: string; // ref. kód, např. BRK-7F3K9Q
  slotId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  service: string; // id služby
  status: BookingStatus;
  cancelReason?: string;
  createdAt: string;
  cancelledAt?: string;
};

export type Penalty = {
  id: string;
  phone: string; // normalizovaný telefon klienta (jen číslice)
  amount: number; // Kč
  bookingId?: string; // rezervace, jejíž pozdní zrušení pokutu způsobilo
  reason?: string;
  createdAt: string;
};
