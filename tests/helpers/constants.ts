/**
 * Frozen "today" used across all E2E tests for deterministic date-dependent behavior.
 *
 * Kept ~12 months in the future so seed deposits remain clearly "active" or "future"
 * relative to the frozen now, and status badges stay stable.
 * Refresh this value (and the exact filename in import-export.spec.ts) whenever it
 * drifts more than ~3 months into the past. When bumping, shift all active seed
 * deposit startDates forward by the same interval.
 */
export const FROZEN_TEST_DATE = new Date(2027, 2, 6); // Mar 6, 2027
