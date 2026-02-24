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

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
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

export function differenceInCalendarDays(later: Date, earlier: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  const end = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  return Math.round((end - start) / msPerDay);
}
