import type { TimeDeposit } from "@/types";

/** What to reinvest when renewing a matured deposit. */
export type RenewalMode = "all" | "principal-only";

/** Pre-fill config when the wizard is opened for a renewal. */
export type RenewalConfig = {
  /** ID of the deposit being renewed (will be settled on wizard submit). */
  sourceId: string;
  /** Source deposit — used to pre-fill the wizard. */
  deposit: TimeDeposit;
  /** Pre-filled principal: full proceeds or original principal. */
  proceedsPrincipal: number;
  /** Pre-filled start date: the source deposit's maturity date. */
  startDate: string;
};

/** Which renewal modes a deposit offers. TD Monthly already pays interest out
 * each month, so both variants collapse to principal-only — only `all` is
 * offered. */
export function getRenewalOptions(deposit: TimeDeposit): RenewalMode[] {
  return deposit.payoutFrequency === "monthly" ? ["all"] : ["all", "principal-only"];
}

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
