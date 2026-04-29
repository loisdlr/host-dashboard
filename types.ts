export type UnitType = "studio" | "one_bedroom";

export type Channel = "direct" | "airbnb" | "booking" | "agoda";

export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  nightlyRate: number;
  cleaningFee: number;
  icalImportUrls: { channel: Channel; url: string }[];
  icalExportUrl?: string;
}

export interface Booking {
  id: string;
  unitId: string;
  guestName: string;
  channel: Channel;
  checkIn: string; // ISO yyyy-mm-dd
  checkOut: string; // ISO yyyy-mm-dd (exclusive)
  nightlyRate: number;
  cleaningFee: number;
  extraFees: number;
  guestCount: number;
  notes?: string;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
}

export interface Expense {
  id: string;
  unitId: string | "all";
  date: string; // ISO yyyy-mm-dd
  amount: number;
  category: string;
  description: string;
}

export interface Bill {
  id: string;
  unitId: string;
  name: string;
  amount: number;
  dueDay: number; // day of month, 1-31
  recurring: boolean;
  paidMonths: string[]; // YYYY-MM strings already paid
}

export interface Cleaner {
  id: string;
  name: string;
  phone?: string;
  ratePerClean: number;
}

export interface CleaningJob {
  id: string;
  bookingId?: string;
  unitId: string;
  cleanerId: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  paid: boolean;
  paidAt?: string;
  notes?: string;
}

export interface RateTier {
  base2: number;
  base4: number;
}

export interface UnitPricing {
  weekday: RateTier;
  weekend: RateTier;
  holiday: RateTier;
  extraPaxFee: number;
}

export interface Pricing {
  studio: UnitPricing;
  oneBedroom: UnitPricing;
  petFeePerNight: number;
}

export interface Settings {
  investorSharePct: number; // e.g. 60
  operatorSharePct: number; // e.g. 40
  studioRate: number;
  oneBedroomRate: number;
  cleaningFee: number;
  currency: string;
  pricing: Pricing;
}

export interface AppState {
  units: Unit[];
  bookings: Booking[];
  expenses: Expense[];
  bills: Bill[];
  cleaners: Cleaner[];
  jobs: CleaningJob[];
  settings: Settings;
}
