export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() < day) {
    next.setDate(0);
  }
  return next;
}

// Supports fractional tenure. Example: 0.5 month -> 15 days (30-day month basis).
export function addTermMonths(date: Date, termMonths: number) {
  const safeMonths = Number.isFinite(termMonths) ? Math.max(termMonths, 0) : 0;
  const wholeMonths = Math.trunc(safeMonths);
  const fractionalMonths = safeMonths - wholeMonths;
  const next = addMonths(date, wholeMonths);
  if (fractionalMonths <= 0) return next;
  const extraDays = Math.round(fractionalMonths * 30);
  next.setDate(next.getDate() + extraDays);
  return next;
}

// Parse a stored YYYY-MM-DD string as local midnight.
//
// new Date("YYYY-MM-DD") is specified to parse as UTC midnight per the JS spec,
// which shifts the local date in UTC+ timezones (e.g. Manila at UTC+8 sees the
// previous day's 8pm instead of today's midnight). Appending "T00:00:00" (no Z)
// forces the browser to interpret the string in local time instead.
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

// Convert a Date to a YYYY-MM-DD string representing the local calendar date.
//
// We use local date components (not toISOString) because ISO date strings in
// this app represent calendar dates in the user's local timezone. toISOString()
// returns UTC and would produce a date 1 day early for UTC+ users (e.g. June 15
// at 8am Manila = June 14 in UTC, so toISOString slices to "2025-06-14").
export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Add whole calendar days to a date using local date components, consistent with
// the timezone-safe approach used throughout this module.
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function differenceInCalendarDays(later: Date, earlier: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  const end = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  return Math.round((end - start) / msPerDay);
}
