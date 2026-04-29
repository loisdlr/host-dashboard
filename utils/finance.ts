import type { Booking, Expense, Settings } from "@/types";
import { dateInRange, diffDays, ymKey } from "./date";

export function bookingTotal(b: Booking): number {
  const nights = Math.max(0, diffDays(b.checkIn, b.checkOut));
  return nights * b.nightlyRate + b.cleaningFee + b.extraFees;
}

export function bookingNetIncome(b: Booking): number {
  // Nightly income only (excludes cleaning recovery & extra fees) for distribution
  const nights = Math.max(0, diffDays(b.checkIn, b.checkOut));
  return nights * b.nightlyRate;
}

export function bookingsForUnit(bookings: Booking[], unitId: string): Booking[] {
  return bookings.filter(
    (b) => b.unitId === unitId && b.status !== "cancelled",
  );
}

export function bookingsForRange(
  bookings: Booking[],
  start: string,
  end: string,
): Booking[] {
  return bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.checkIn < end &&
      b.checkOut > start,
  );
}

export function unitOccupancyOnDate(
  bookings: Booking[],
  unitId: string,
  date: string,
): Booking | null {
  return (
    bookings.find(
      (b) =>
        b.unitId === unitId &&
        b.status !== "cancelled" &&
        dateInRange(date, b.checkIn, b.checkOut),
    ) ?? null
  );
}

export function totalIncome(bookings: Booking[]): number {
  return bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + bookingTotal(b), 0);
}

export function totalExpenses(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function expensesForUnit(
  expenses: Expense[],
  unitId: string,
): Expense[] {
  return expenses.filter((e) => e.unitId === unitId || e.unitId === "all");
}

export function incomeForMonth(bookings: Booking[], ym: string): number {
  return bookings
    .filter((b) => b.status !== "cancelled" && ymKey(b.checkIn) === ym)
    .reduce((s, b) => s + bookingTotal(b), 0);
}

export interface SplitResult {
  gross: number;
  expenses: number;
  net: number;
  investorShare: number;
  operatorShare: number;
}

export function splitForUnit(
  unitId: string,
  bookings: Booking[],
  expenses: Expense[],
  settings: Settings,
  range?: { start: string; end: string },
): SplitResult {
  let unitBookings = bookings.filter(
    (b) => b.unitId === unitId && b.status !== "cancelled",
  );
  let unitExpenses = expenses.filter(
    (e) => e.unitId === unitId || e.unitId === "all",
  );

  if (range) {
    unitBookings = unitBookings.filter(
      (b) => b.checkIn < range.end && b.checkOut > range.start,
    );
    unitExpenses = unitExpenses.filter(
      (e) => e.date >= range.start && e.date <= range.end,
    );
  }

  const gross = unitBookings.reduce((s, b) => s + bookingNetIncome(b), 0);
  const exp = unitExpenses.reduce((s, e) => s + e.amount, 0);
  const net = gross - exp;
  return {
    gross,
    expenses: exp,
    net,
    investorShare: (net * settings.investorSharePct) / 100,
    operatorShare: (net * settings.operatorSharePct) / 100,
  };
}

export function splitForAll(
  bookings: Booking[],
  expenses: Expense[],
  settings: Settings,
  range?: { start: string; end: string },
): SplitResult {
  let allBookings = bookings.filter((b) => b.status !== "cancelled");
  let allExpenses = expenses;
  if (range) {
    allBookings = allBookings.filter(
      (b) => b.checkIn < range.end && b.checkOut > range.start,
    );
    allExpenses = allExpenses.filter(
      (e) => e.date >= range.start && e.date <= range.end,
    );
  }
  const gross = allBookings.reduce((s, b) => s + bookingNetIncome(b), 0);
  const exp = allExpenses.reduce((s, e) => s + e.amount, 0);
  const net = gross - exp;
  return {
    gross,
    expenses: exp,
    net,
    investorShare: (net * settings.investorSharePct) / 100,
    operatorShare: (net * settings.operatorSharePct) / 100,
  };
}

export function formatMoney(value: number, currency = "₱"): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${currency}${abs.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
