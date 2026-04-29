export const MS_DAY = 86_400_000;

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function diffDays(a: string, b: string): number {
  const d1 = parseISODate(a).getTime();
  const d2 = parseISODate(b).getTime();
  return Math.round((d2 - d1) / MS_DAY);
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function dateInRange(date: string, start: string, end: string): boolean {
  // end is exclusive (checkout day)
  return date >= start && date < end;
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function formatShort(date: string): string {
  const d = parseISODate(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatLong(date: string): string {
  const d = parseISODate(date);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function buildDateRange(start: Date, days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(toISODate(addDays(start, i)));
  }
  return out;
}

export function dayOfWeekShort(date: string): string {
  return parseISODate(date).toLocaleDateString(undefined, { weekday: "narrow" });
}

export function ymKey(date: string): string {
  return date.slice(0, 7);
}

export function monthDays(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
