import { describe, expect, it } from "vitest";
import { formatCurrency, getCurrencySymbol } from "@/lib/domain/format";

describe("formatCurrency (PHP)", () => {
  it("formats whole numbers with ₱ prefix", () => {
    const result = formatCurrency(100000, "PHP");
    expect(result).toMatch(/₱/);
    expect(result).toMatch(/100,000/);
  });

  it("rounds to no decimal places", () => {
    const result = formatCurrency(1234.56, "PHP");
    expect(result).not.toMatch(/\./);
    expect(result).toMatch(/1,235/);
  });

  it("formats zero", () => {
    const result = formatCurrency(0, "PHP");
    expect(result).toMatch(/₱/);
    expect(result).toMatch(/0/);
  });

  it("formats large amounts with comma separators", () => {
    const result = formatCurrency(1000000, "PHP");
    expect(result).toMatch(/1,000,000/);
  });

  it("formats negative values", () => {
    const result = formatCurrency(-5000, "PHP");
    expect(result).toMatch(/5,000/);
  });
});

describe("formatCurrency — other currencies", () => {
  it("formats USD with $ symbol", () => {
    const result = formatCurrency(100_000, "USD");
    expect(result).toMatch(/\$/);
    expect(result).toMatch(/100,000/);
  });

  it("formats EUR with € symbol", () => {
    const result = formatCurrency(50_000, "EUR");
    expect(result).toMatch(/€/);
  });

  it("formats JPY as a whole number (no fractional digits)", () => {
    const result = formatCurrency(100_000, "JPY");
    expect(result).toMatch(/¥/);
    expect(result).toMatch(/100,000/);
    // JPY has no decimal places; maximumFractionDigits=0 enforces this
    expect(result).not.toMatch(/\./);
  });

  it("formats GBP with £ symbol", () => {
    const result = formatCurrency(75_000, "GBP");
    expect(result).toMatch(/£/);
    expect(result).toMatch(/75,000/);
  });
});

describe("formatCurrency — edge inputs", () => {
  it("handles NaN without throwing (documents Intl behavior)", () => {
    // Intl.NumberFormat gracefully formats NaN; result is a string (locale-specific)
    const result = formatCurrency(NaN, "PHP");
    expect(typeof result).toBe("string");
  });

  it("handles Infinity without throwing (documents Intl behavior)", () => {
    const result = formatCurrency(Infinity, "PHP");
    expect(typeof result).toBe("string");
  });

  it("handles very large values without throwing", () => {
    const result = formatCurrency(1_000_000_000, "PHP");
    expect(result).toMatch(/1,000,000,000/);
  });

  it("handles negative values for non-PHP currencies", () => {
    const result = formatCurrency(-1000, "USD");
    expect(typeof result).toBe("string");
    expect(result).toMatch(/1,000/);
  });
});

describe("getCurrencySymbol", () => {
  it("returns ₱ for PHP", () => {
    expect(getCurrencySymbol("PHP")).toBe("₱");
  });

  it("returns $ for USD", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  it("returns € for EUR", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  it("returns £ for GBP", () => {
    expect(getCurrencySymbol("GBP")).toBe("£");
  });

  it("returns ¥ for JPY", () => {
    expect(getCurrencySymbol("JPY")).toBe("¥");
  });

  it("returns a non-empty string for any supported currency", () => {
    // Covers currencies where the symbol may be multi-char (SGD → "S$", HKD → "HK$", etc.)
    for (const code of ["SGD", "AUD", "CAD", "HKD"]) {
      const symbol = getCurrencySymbol(code);
      expect(typeof symbol).toBe("string");
      expect(symbol.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the currency code when no single-char symbol exists", () => {
    // CHF does not have a universal single-char symbol; the fallback (?? currency) returns a string
    const symbol = getCurrencySymbol("CHF");
    expect(typeof symbol).toBe("string");
    expect(symbol.length).toBeGreaterThan(0);
  });
});
