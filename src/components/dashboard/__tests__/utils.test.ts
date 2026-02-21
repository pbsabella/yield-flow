import { describe, expect, it } from "vitest";
import {
  decimalToPercentString,
  normalizeNumericInput,
  percentToDecimalString,
} from "@/components/dashboard/utils";

describe("dashboard utils", () => {
  it("normalizes floating artifacts from number inputs", () => {
    expect(normalizeNumericInput("3.2199999999999998", 2)).toBe("3.22");
    expect(normalizeNumericInput("100.00000000000001", 2)).toBe("100");
  });

  it("keeps percent conversions stable after normalization", () => {
    const percent = normalizeNumericInput("5.5000000000000001", 6);
    const decimal = percentToDecimalString(percent);
    expect(decimal).toBe("0.055");
    expect(decimalToPercentString(decimal)).toBe("5.5");
  });
});
