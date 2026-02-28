import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/domain/format";

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
