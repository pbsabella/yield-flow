import { describe, expect, it } from "vitest";
import { formatPhpCurrency } from "@/lib/domain/format";

describe("formatPhpCurrency", () => {
  it("formats whole numbers with ₱ prefix", () => {
    const result = formatPhpCurrency(100000);
    expect(result).toMatch(/₱/);
    expect(result).toMatch(/100,000/);
  });

  it("rounds to no decimal places", () => {
    const result = formatPhpCurrency(1234.56);
    expect(result).not.toMatch(/\./);
    expect(result).toMatch(/1,235/);
  });

  it("formats zero", () => {
    const result = formatPhpCurrency(0);
    expect(result).toMatch(/₱/);
    expect(result).toMatch(/0/);
  });

  it("formats large amounts with comma separators", () => {
    const result = formatPhpCurrency(1000000);
    expect(result).toMatch(/1,000,000/);
  });

  it("formats negative values", () => {
    const result = formatPhpCurrency(-5000);
    expect(result).toMatch(/5,000/);
  });
});
