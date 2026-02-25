// TODO: multi-currency — replace with formatCurrency(value, locale, currency) when
// multi-currency support is added. Currently hard-coded for Philippine Peso (PHP).
export function formatPhpCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}
