import { useRef, useCallback } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps a cursor position in a comma-formatted string back to its position in
 * the raw digit string (ignoring commas).
 */
function rawCursorPos(formatted: string, cursor: number): number {
  return formatted.slice(0, cursor).replace(/,/g, "").length;
}

/**
 * Maps a raw digit cursor position back into the equivalent position in a
 * comma-formatted string.
 */
function formattedCursorPos(formatted: string, rawPos: number): number {
  let raw = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ",") raw++;
    if (raw === rawPos) return i + 1;
  }
  return formatted.length;
}

/**
 * Inserts thousand-separator commas into the integer part.
 * Preserves the decimal portion exactly as typed during the "Active" state.
 */
function addCommas(raw: string): string {
  if (!raw) return "";
  const dotIndex = raw.indexOf(".");
  const intPart = dotIndex === -1 ? raw : raw.slice(0, dotIndex);
  const decPart = dotIndex === -1 ? "" : raw.slice(dotIndex); // Includes the "."
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + decPart;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseCurrencyInputOptions {
  /** Raw numeric string stored in state (e.g., "1030000.50") */
  value: string;
  /** Called with the cleaned raw numeric string whenever the user types. */
  onChange: (raw: string) => void;
  /** Optional callback for tracking field touch/blur state. */
  onBlur?: () => void;
}

/**
 * useCurrencyInput
 * * Satisfies UX requirements for currency data entry:
 * 1. Live comma formatting for visual anchoring.
 * 2. Prevents cursor jumping when commas are added/removed.
 * 3. Handles ".5" -> "0.5" (Leading decimal).
 * 4. Handles "05" -> "5" (Leading zeros).
 * 5. Handles "3." -> "3" (Cleanup on Blur).
 * 6. Mobile-friendly numeric keypad.
 */
export function useCurrencyInput({ value, onChange, onBlur }: UseCurrencyInputOptions) {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursor = input.selectionStart ?? 0;

      // Snapshot the cursor in raw-digit space before formatting
      const rawCursorBefore = rawCursorPos(input.value, cursor);

      // 1. Strip commas for processing
      let cleaned = input.value.replace(/,/g, "");

      // 2. Allow only digits and a single decimal point
      cleaned = cleaned.replace(/[^\d.]/g, "");
      const firstDot = cleaned.indexOf(".");
      if (firstDot !== -1) {
        cleaned =
          cleaned.slice(0, firstDot + 1) +
          cleaned.slice(firstDot + 1).replace(/\./g, "");
      }

      // 3. Fix Leading Dot: ".5" -> "0.5"
      if (cleaned.startsWith(".")) {
        cleaned = "0" + cleaned;
      }

      // 4. Fix Leading Zeros: "05" -> "5", but allow "0.5"
      if (cleaned.length > 1 && cleaned.startsWith("0") && cleaned[1] !== ".") {
        cleaned = cleaned.replace(/^0+/, "");
      }

      onChange(cleaned);

      // 5. Restore cursor position in the next paint
      const newFormatted = addCommas(cleaned);
      requestAnimationFrame(() => {
        if (ref.current && document.activeElement === ref.current) {
          const newCursor = formattedCursorPos(newFormatted, rawCursorBefore);
          ref.current.setSelectionRange(newCursor, newCursor);
        }
      });
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    // 6. Cleanup trailing decimal: "3." -> "3"
    let finalized = value;
    if (finalized.endsWith(".")) {
      finalized = finalized.slice(0, -1);
    }

    // Ensure "0.0" or similar doesn't stay messy if necessary
    // (Optional: parseFloat(finalized).toString() for deep cleaning)

    onChange(finalized);
    onBlur?.();
  }, [value, onChange, onBlur]);

  return {
    ref,
    value: addCommas(value),
    type: "text" as const,
    inputMode: "decimal" as const,
    onChange: handleChange,
    onBlur: handleBlur,
    autoComplete: "off",
    spellCheck: false,
  };
}
