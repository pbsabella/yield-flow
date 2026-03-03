export const SUPPORTED_CURRENCIES = [
  { code: "PHP", label: "Philippine Peso (₱)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "SGD", label: "Singapore Dollar (S$)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "HKD", label: "Hong Kong Dollar (HK$)" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

const REGION_TO_CURRENCY: Partial<Record<string, CurrencyCode>> = {
  PH: "PHP",
  US: "USD", GB: "GBP", AU: "AUD", CA: "CAD",
  SG: "SGD", JP: "JPY", HK: "HKD",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", FI: "EUR", IE: "EUR",
};

/**
 * Infers a supported currency from the browser locale (navigator.language).
 * Falls back to "USD" for unrecognized regions. Safe to call during SSR.
 */
export function getLocaleCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  try {
    const region = new Intl.Locale(navigator.language).region ?? "";
    return REGION_TO_CURRENCY[region] ?? "USD";
  } catch {
    return "USD";
  }
}

/**
 * Extracts the currency symbol for use in input addons.
 * e.g. "PHP" → "₱", "USD" → "$"
 */
export function getCurrencySymbol(currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value ?? currency;
}
