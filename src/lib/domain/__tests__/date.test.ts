import { describe, expect, it } from "vitest";
import {
  addMonths,
  addTermMonths,
  differenceInCalendarDays,
  formatDate,
  formatMonthLabel,
  monthKey,
  parseLocalDate,
  toISODate,
} from "@/lib/domain/date";

// ─── Test input convention ────────────────────────────────────────────────────
//
// All date inputs use parseLocalDate("YYYY-MM-DD") or new Date("YYYY-MM-DDT00:00:00")
// (local midnight, no Z suffix). This makes the tests timezone-independent:
// local date methods (getDate, getMonth, etc.) always return the intended values
// regardless of the system's TZ setting.
//
// Avoid: new Date("YYYY-MM-DD") — the spec parses date-only strings as UTC midnight,
// which shifts the local date in UTC- environments (e.g. March 15 UTC midnight =
// March 14 at 7pm in UTC-5, causing getDate() to return 14 instead of 15).

describe("parseLocalDate", () => {
  // parseLocalDate is the canonical way to convert a stored YYYY-MM-DD string
  // back to a Date. It must produce local midnight so all subsequent local
  // date operations (getDate, getMonth, differenceInCalendarDays, etc.) agree.

  it("produces a Date where local date methods return the stored calendar day", () => {
    const d = parseLocalDate("2025-06-15");
    // These assertions use local methods — they pass in any timezone because
    // the input was parsed as local midnight.
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5); // June = index 5 (zero-indexed)
    expect(d.getDate()).toBe(15);
  });

  it("handles January (month index 0)", () => {
    const d = parseLocalDate("2025-01-01");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("handles December 31 (year boundary)", () => {
    const d = parseLocalDate("2025-12-31");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11); // December
    expect(d.getDate()).toBe(31);
  });

  it("round-trips with toISODate: store → parse → store returns the identical string", () => {
    // This is the fundamental contract of the date system: a stored date string,
    // when parsed and re-serialized, must produce the exact same value.
    const cases = ["2025-03-15", "2025-01-01", "2025-12-31", "2026-02-28"];
    for (const original of cases) {
      expect(toISODate(parseLocalDate(original))).toBe(original);
    }
  });
});

describe("toISODate", () => {
  it("extracts the local calendar date as YYYY-MM-DD", () => {
    // Input: local midnight (no Z) — timezone-independent, getDate() = 7 everywhere.
    const d = new Date("2025-03-07T00:00:00");
    expect(toISODate(d)).toBe("2025-03-07");
  });

  it("zero-pads month and day", () => {
    expect(toISODate(parseLocalDate("2025-01-05"))).toBe("2025-01-05");
    expect(toISODate(parseLocalDate("2025-09-09"))).toBe("2025-09-09");
  });

  it("round-trips with parseLocalDate", () => {
    expect(toISODate(parseLocalDate("2025-11-30"))).toBe("2025-11-30");
  });
});

describe("addMonths", () => {
  // Inputs use parseLocalDate so tests are timezone-independent — see note above.

  it("adds whole months", () => {
    const result = addMonths(parseLocalDate("2025-01-15"), 3);
    expect(toISODate(result)).toBe("2025-04-15");
  });

  it("clamps to end of month when target month is shorter", () => {
    // Jan 31 + 1 month → Feb has no 31st → clamp to Feb 28
    const result = addMonths(parseLocalDate("2025-01-31"), 1);
    expect(toISODate(result)).toBe("2025-02-28");
  });

  it("handles year rollover", () => {
    const result = addMonths(parseLocalDate("2025-11-01"), 3);
    expect(toISODate(result)).toBe("2026-02-01");
  });

  it("adding 0 months returns same date", () => {
    const result = addMonths(parseLocalDate("2025-06-15"), 0);
    expect(toISODate(result)).toBe("2025-06-15");
  });
});

describe("addTermMonths", () => {
  it("handles whole month terms the same as addMonths", () => {
    const result = addTermMonths(parseLocalDate("2025-08-02"), 6);
    expect(toISODate(result)).toBe("2026-02-02");
  });

  it("adds fractional months as days (0.5 month = 15 days on 30-day basis)", () => {
    const result = addTermMonths(parseLocalDate("2026-02-01"), 0.5);
    expect(toISODate(result)).toBe("2026-02-16");
  });

  it("handles non-finite input by defaulting to 0", () => {
    const base = parseLocalDate("2025-06-01");
    const result = addTermMonths(base, NaN);
    expect(toISODate(result)).toBe("2025-06-01");
  });

  it("clamps negative terms to 0", () => {
    const base = parseLocalDate("2025-06-01");
    const result = addTermMonths(base, -3);
    expect(toISODate(result)).toBe("2025-06-01");
  });
});

describe("formatDate", () => {
  it("formats a date as human-readable month/day/year", () => {
    // "T00:00:00" = local midnight, ensures the local date is June 15 in all TZs.
    const result = formatDate(new Date("2025-06-15T00:00:00"));
    expect(result).toMatch(/Jun.*15.*2025/);
  });
});

describe("formatMonthLabel", () => {
  it("formats a date as Month Year", () => {
    const result = formatMonthLabel(new Date("2026-02-01T00:00:00"));
    expect(result).toMatch(/Feb.*2026/);
  });
});

describe("monthKey", () => {
  it("returns YYYY-MM with zero-padded month", () => {
    expect(monthKey(new Date("2025-03-15T00:00:00"))).toBe("2025-03");
    expect(monthKey(new Date("2025-11-01T00:00:00"))).toBe("2025-11");
  });

  it("pads single-digit months", () => {
    expect(monthKey(new Date("2025-01-01T00:00:00"))).toBe("2025-01");
    expect(monthKey(new Date("2025-09-30T00:00:00"))).toBe("2025-09");
  });
});

describe("differenceInCalendarDays", () => {
  // differenceInCalendarDays is safe: it extracts local date components then
  // uses Date.UTC() for arithmetic, so it's immune to parse ambiguity.
  // Inputs still use parseLocalDate for consistency and clarity.

  it("counts days between two dates", () => {
    const earlier = parseLocalDate("2025-01-01");
    const later = parseLocalDate("2025-01-31");
    expect(differenceInCalendarDays(later, earlier)).toBe(30);
  });

  it("returns 0 for same date", () => {
    const d = parseLocalDate("2025-06-15");
    expect(differenceInCalendarDays(d, d)).toBe(0);
  });

  it("handles month boundaries", () => {
    const earlier = parseLocalDate("2025-08-02");
    const later = parseLocalDate("2026-02-02");
    expect(differenceInCalendarDays(later, earlier)).toBe(184);
  });

  it("handles leap year", () => {
    const earlier = parseLocalDate("2024-02-01");
    const later = parseLocalDate("2024-03-01");
    expect(differenceInCalendarDays(later, earlier)).toBe(29);
  });
});
