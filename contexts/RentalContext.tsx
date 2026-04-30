import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  AppState,
  Bill,
  Booking,
  Cleaner,
  CleaningJob,
  Expense,
  Settings,
  Unit,
} from "@/types";
import { uid } from "@/utils/id";
import { addDays, todayISO, toISODate } from "@/utils/date";

const STORAGE_KEY = "rental-data-v2";

const DEFAULT_SETTINGS: Settings = {
  investorSharePct: 60,
  operatorSharePct: 40,
  studioRate: 2300,
  oneBedroomRate: 2700,
  cleaningFee: 500,
  currency: "₱",
  pricing: {
    studio: {
      weekday: { base2: 2000, base4: 2500 },
      weekend: { base2: 2300, base4: 2800 },
      holiday: { base2: 2500, base4: 2800 },
      extraPaxFee: 400,
    },
    oneBedroom: {
      weekday: { base2: 2400, base4: 2800 },
      weekend: { base2: 2600, base4: 2900 },
      holiday: { base2: 2800, base4: 3100 },
      extraPaxFee: 400,
    },
    petFeePerNight: 500,
  },
};

function defaultUnits(): Unit[] {
  const names = [
    { name: "Tower A 16C", type: "studio" as const },
    { name: "Tower A 24G", type: "one_bedroom" as const },
    { name: "Tower B 31M", type: "one_bedroom" as const },
    { name: "Tower C 10G", type: "one_bedroom" as const },
    { name: "Tower D 17J", type: "studio" as const },
    { name: "Tower D 6F", type: "studio" as const },
  ];
  return names.map((u) => ({
    id: uid(),
    name: u.name,
    type: u.type,
    nightlyRate: u.type === "studio" ? 2300 : 2700,
    cleaningFee: 500,
    icalImportUrls: [],
  }));
}

function seedBookings(units: Unit[]): Booking[] {
  const now = new Date();
  const list: Booking[] = [];
  const channels = ["airbnb", "booking", "direct", "agoda"] as const;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u) continue;
    const offset = i * 2 - 1;
    const checkIn = toISODate(addDays(now, offset));
    const checkOut = toISODate(addDays(now, offset + (i % 3) + 2));
    list.push({
      id: uid(),
      unitId: u.id,
      guestName: ["M. Cruz", "J. Tan", "A. Rivera", "S. Park", "L. Reyes", "K. Wong"][i] ?? "Guest",
      channel: channels[i % channels.length],
      checkIn,
      checkOut,
      nightlyRate: u.nightlyRate,
      cleaningFee: u.cleaningFee,
      extraFees: 0,
      guestCount: (i % 3) + 1,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
  }
  return list;
}

function seedBills(units: Unit[]): Bill[] {
  // Per-unit recurring bills. Use 0 for amounts so the operator can edit
  // them in the Dues screen with their actual monthly figures.
  const schedule: Record<
    string,
    { name: string; dueDay: number; amount: number }[]
  > = {
    "Tower A 16C": [
      { name: "Rent", dueDay: 27, amount: 0 },
      { name: "Internet", dueDay: 25, amount: 0 },
      { name: "Water", dueDay: 3, amount: 0 },
      { name: "Ifae", dueDay: 3, amount: 0 },
      { name: "Meralco", dueDay: 2, amount: 0 },
    ],
    "Tower A 24G": [
      { name: "Rent", dueDay: 1, amount: 0 },
      { name: "Internet", dueDay: 27, amount: 0 },
      { name: "Water", dueDay: 3, amount: 0 },
      { name: "Ifae", dueDay: 3, amount: 0 },
      { name: "Meralco", dueDay: 3, amount: 0 },
    ],
    "Tower B 31M": [
      { name: "Internet", dueDay: 17, amount: 0 },
      { name: "Water", dueDay: 3, amount: 0 },
      { name: "Ifae", dueDay: 3, amount: 0 },
      { name: "Meralco", dueDay: 2, amount: 0 },
    ],
    "Tower C 10G": [
      { name: "Internet", dueDay: 27, amount: 0 },
      { name: "Water", dueDay: 3, amount: 0 },
      { name: "Ifae", dueDay: 3, amount: 0 },
      { name: "Meralco", dueDay: 2, amount: 0 },
    ],
    "Tower D 17J": [
      { name: "Rent", dueDay: 12, amount: 0 },
      { name: "Water", dueDay: 3, amount: 0 },
      { name: "Ifae", dueDay: 3, amount: 0 },
      { name: "Meralco", dueDay: 2, amount: 0 },
    ],
    "Tower D 6F": [
      { name: "Rent", dueDay: 22, amount: 0 },
      { name: "Water", dueDay: 3, amount: 0 },
      { name: "Ifae", dueDay: 3, amount: 0 },
      { name: "Meralco", dueDay: 2, amount: 0 },
    ],
  };

  const out: Bill[] = [];
  units.forEach((u) => {
    const bills = schedule[u.name] ?? [];
    bills.forEach((b) => {
      out.push({
        id: uid(),
        unitId: u.id,
        name: b.name,
        amount: b.amount,
        dueDay: b.dueDay,
        recurring: true,
        paidMonths: [],
      });
    });
  });
  return out;
}

function seedCleaners(): Cleaner[] {
  return [
    { id: uid(), name: "Marites D.", phone: "0917-555-1010", ratePerClean: 450 },
    { id: uid(), name: "Jocelyn R.", phone: "0917-555-2020", ratePerClean: 450 },
    { id: uid(), name: "Edna P.", phone: "0917-555-3030", ratePerClean: 500 },
  ];
}

function seedExpenses(units: Unit[]): Expense[] {
  const today = todayISO();
  return units.slice(0, 3).map((u, i) => ({
    id: uid(),
    unitId: u.id,
    date: today,
    amount: 600 + i * 150,
    category: "Complimentary Supplies",
    description: "Toiletries restock",
  }));
}

function freshState(): AppState {
  const units = defaultUnits();
  return {
    units,
    bookings: seedBookings(units),
    expenses: seedExpenses(units),
    bills: seedBills(units),
    cleaners: seedCleaners(),
    jobs: [],
    settings: DEFAULT_SETTINGS,
  };
}

interface ContextValue extends AppState {
  ready: boolean;
  // bookings
  addBooking: (b: Omit<Booking, "id" | "createdAt">) => Booking;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;
  deleteBooking: (id: string) => void;
  // expenses
  addExpense: (e: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  // bills
  addBill: (b: Omit<Bill, "id" | "paidMonths">) => void;
  updateBill: (id: string, patch: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  toggleBillPaid: (id: string, ym: string) => void;
  // cleaners
  addCleaner: (c: Omit<Cleaner, "id">) => void;
  updateCleaner: (id: string, patch: Partial<Cleaner>) => void;
  deleteCleaner: (id: string) => void;
  // jobs
  addJob: (j: Omit<CleaningJob, "id">) => void;
  updateJob: (id: string, patch: Partial<CleaningJob>) => void;
  deleteJob: (id: string) => void;
  // units
  addUnit: (u: Omit<Unit, "id" | "icalImportUrls">) => void;
  updateUnit: (id: string, patch: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;
  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  // helpers
  reset: () => void;
}

const RentalContext = createContext<ContextValue | null>(null);

export function RentalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => freshState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppState;
          setState(parsed);
        }
      } catch {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
  if (ready) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(err => console.error("SAVE ERROR:", err));
  }
}, [state, ready]);

  // bookings
  const addBooking = useCallback(
    (b: Omit<Booking, "id" | "createdAt">): Booking => {
      const booking: Booking = {
        ...b,
        id: uid(),
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, bookings: [...s.bookings, booking] }));
      return booking;
    },
    [],
  );

  const updateBooking = useCallback((id: string, patch: Partial<Booking>) => {
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: "cancelled" } : b,
      ),
    }));
  }, []);

  const deleteBooking = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      bookings: s.bookings.filter((b) => b.id !== id),
    }));
  }, []);

  // expenses
  const addExpense = useCallback((e: Omit<Expense, "id">) => {
    const expense: Expense = { ...e, id: uid() };
    setState((s) => ({ ...s, expenses: [...s.expenses, expense] }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      expenses: s.expenses.filter((e) => e.id !== id),
    }));
  }, []);

  // bills
  const addBill = useCallback((b: Omit<Bill, "id" | "paidMonths">) => {
    const bill: Bill = { ...b, id: uid(), paidMonths: [] };
    setState((s) => ({ ...s, bills: [...s.bills, bill] }));
  }, []);

  const updateBill = useCallback((id: string, patch: Partial<Bill>) => {
    setState((s) => ({
      ...s,
      bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setState((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));
  }, []);

  const toggleBillPaid = useCallback((id: string, ym: string) => {
    setState((s) => ({
      ...s,
      bills: s.bills.map((b) => {
        if (b.id !== id) return b;
        const has = b.paidMonths.includes(ym);
        return {
          ...b,
          paidMonths: has
            ? b.paidMonths.filter((m) => m !== ym)
            : [...b.paidMonths, ym],
        };
      }),
    }));
  }, []);

  // cleaners
  const addCleaner = useCallback((c: Omit<Cleaner, "id">) => {
    setState((s) => ({
      ...s,
      cleaners: [...s.cleaners, { ...c, id: uid() }],
    }));
  }, []);

  const updateCleaner = useCallback((id: string, patch: Partial<Cleaner>) => {
    setState((s) => ({
      ...s,
      cleaners: s.cleaners.map((c) => 
        // Force both to strings to ensure they match
        String(c.id) === String(id) ? { ...c, ...patch } : c
      ),
    }));
  }, []);

  const deleteCleaner = useCallback((id: string) => {
  setState((s) => {
    // We create a filtered list...
    const newList = s.cleaners.filter((c) => String(c.id) !== String(id));
    
    // ...and we return a NEW object with a NEW array spread into it
    // The [...] is what tells the screen "WAKE UP, SOMETHING CHANGED!"
    return { 
      ...s, 
      cleaners: [...newList] 
    };
  });
}, []);

  // jobs
  const addJob = useCallback((j: Omit<CleaningJob, "id">) => {
    setState((s) => ({ ...s, jobs: [...s.jobs, { ...j, id: uid() }] }));
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<CleaningJob>) => {
    setState((s) => ({
      ...s,
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    }));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setState((s) => ({ ...s, jobs: s.jobs.filter((j) => j.id !== id) }));
  }, []);

  // units
  const addUnit = useCallback((u: Omit<Unit, "id" | "icalImportUrls">) => {
    setState((s) => ({
      ...s,
      units: [...s.units, { ...u, id: uid(), icalImportUrls: [] }],
    }));
  }, []);

  const updateUnit = useCallback((id: string, patch: Partial<Unit>) => {
    setState((s) => ({
      ...s,
      units: s.units.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }));
  }, []);

  const deleteUnit = useCallback((id: string) => {
    setState((s) => ({ ...s, units: s.units.filter((u) => u.id !== id) }));
  }, []);

  // settings
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => {
      const next = { ...s.settings, ...patch };
      // keep splits summing to 100 when one is provided
      if (patch.investorSharePct !== undefined) {
        next.operatorSharePct = 100 - patch.investorSharePct;
      } else if (patch.operatorSharePct !== undefined) {
        next.investorSharePct = 100 - patch.operatorSharePct;
      }
      return { ...s, settings: next };
    });
  }, []);

  const reset = useCallback(() => {
    setState(freshState());
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      ...state,
      ready,
      addBooking,
      updateBooking,
      cancelBooking,
      deleteBooking,
      addExpense,
      deleteExpense,
      addBill,
      updateBill,
      deleteBill,
      toggleBillPaid,
      addCleaner,
      updateCleaner,
      deleteCleaner,
      addJob,
      updateJob,
      deleteJob,
      addUnit,
      updateUnit,
      deleteUnit,
      updateSettings,
      reset,
    }),
    [
      state,
      ready,
      addBooking,
      updateBooking,
      cancelBooking,
      deleteBooking,
      addExpense,
      deleteExpense,
      addBill,
      updateBill,
      deleteBill,
      toggleBillPaid,
      addCleaner,
      updateCleaner,
      deleteCleaner,
      addJob,
      updateJob,
      deleteJob,
      addUnit,
      updateUnit,
      deleteUnit,
      updateSettings,
      reset,
    ],
  );

  return (
    <RentalContext.Provider value={value}>{children}</RentalContext.Provider>
  );
}

export function useRental(): ContextValue {
  const ctx = useContext(RentalContext);
  if (!ctx) throw new Error("useRental must be used within RentalProvider");
  return ctx;
}
