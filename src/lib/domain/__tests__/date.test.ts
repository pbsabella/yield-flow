import { describe, expect, it } from "vitest";
import {
  addMonths,
  addTermMonths,
  differenceInCalendarDays,
  formatDate,
  formatMonthLabel,
  monthKey,
  toISODate,
} from "@/lib/domain/date";

describe("addMonths", () => {
  it("adds whole months", () => {
    const result = addMonths(new Date("2025-01-15"), 3);
    expect(toISODate(result)).toBe("2025-04-15");
  });

  it("clamps to end of month when target month is shorter", () => {
    // Jan 31 + 1 month → Feb has no 31st → clamp to Feb 28
    const result = addMonths(new Date("2025-01-31"), 1);
    expect(toISODate(result)).toBe("2025-02-28");
  });

  it("handles year rollover", () => {
    const result = addMonths(new Date("2025-11-01"), 3);
    expect(toISODate(result)).toBe("2026-02-01");
  });

  it("adding 0 months returns same date", () => {
    const result = addMonths(new Date("2025-06-15"), 0);
    expect(toISODate(result)).toBe("2025-06-15");
  });
});

describe("addTermMonths", () => {
  it("handles whole month terms the same as addMonths", () => {
    const result = addTermMonths(new Date("2025-08-02"), 6);
    expect(toISODate(result)).toBe("2026-02-02");
  });

  it("adds fractional months as days (0.5 month = 15 days on 30-day basis)", () => {
    const result = addTermMonths(new Date("2026-02-01"), 0.5);
    expect(toISODate(result)).toBe("2026-02-16");
  });

  it("handles non-finite input by defaulting to 0", () => {
    const base = new Date("2025-06-01");
    const result = addTermMonths(base, NaN);
    expect(toISODate(result)).toBe("2025-06-01");
  });

  it("clamps negative terms to 0", () => {
    const base = new Date("2025-06-01");
    const result = addTermMonths(base, -3);
    expect(toISODate(result)).toBe("2025-06-01");
  });
});

describe("toISODate", () => {
  it("returns YYYY-MM-DD format", () => {
    expect(toISODate(new Date("2025-03-07T00:00:00.000Z"))).toBe("2025-03-07");
  });
});

describe("formatDate", () => {
  it("formats a date as human-readable month/day/year", () => {
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
  it("counts days between two dates", () => {
    const earlier = new Date("2025-01-01");
    const later = new Date("2025-01-31");
    expect(differenceInCalendarDays(later, earlier)).toBe(30);
  });

  it("returns 0 for same date", () => {
    const d = new Date("2025-06-15");
    expect(differenceInCalendarDays(d, d)).toBe(0);
  });

  it("handles month boundaries", () => {
    const earlier = new Date("2025-08-02");
    const later = new Date("2026-02-02");
    expect(differenceInCalendarDays(later, earlier)).toBe(184);
  });

  it("handles leap year", () => {
    const earlier = new Date("2024-02-01");
    const later = new Date("2024-03-01");
    expect(differenceInCalendarDays(later, earlier)).toBe(29);
  });
});
