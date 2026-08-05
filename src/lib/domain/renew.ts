import type { TimeDeposit } from "@/types";

/** What to reinvest when renewing a matured deposit. */
export type RenewalMode = "all" | "principal-only";

/**
 * Compute the principal to pre-fill for a renew wizard.
 *
 * - TD maturity (payoutFrequency === "maturity"): interest compounded or held
 *   until maturity, so the user receives principal + net interest. Renew the
 *   full proceeds (`all`) or just the original principal (`principal-only`).
 * - TD monthly (payoutFrequency === "monthly"): interest was already distributed
 *   each month. At maturity the user only receives the original principal back,
 *   so both modes are identical.
 */
const trimToCents = (value: number) => Math.round(value * 100) / 100;

export function getRenewalPrincipal(
  deposit: TimeDeposit,
  netTotal: number,
  mode: RenewalMode = "all",
): number {
  if (deposit.payoutFrequency === "monthly") return trimToCents(deposit.principal);
  return trimToCents(mode === "principal-only" ? deposit.principal : netTotal);
}
