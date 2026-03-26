import type { TimeDeposit } from "@/types";

/**
 * Compute the principal to pre-fill for a roll-over wizard.
 *
 * - TD maturity (payoutFrequency === "maturity"): interest compounded or held
 *   until maturity, so the user receives principal + net interest. Roll over
 *   the full proceeds.
 * - TD monthly (payoutFrequency === "monthly"): interest was already distributed
 *   each month. At maturity the user only receives the original principal back.
 */
export function getRolloverPrincipal(deposit: TimeDeposit, netTotal: number): number {
  return deposit.payoutFrequency === "monthly" ? deposit.principal : netTotal;
}
