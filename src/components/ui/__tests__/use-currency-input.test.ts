import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCurrencyInput } from "../use-currency-input";

// jsdom's requestAnimationFrame doesn't fire in the microtask queue — stub it
// to run synchronously so cursor-restoration code doesn't hang.
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
});

// Minimal synthetic change event — only the fields the hook reads.
function changeEvent(value: string, selectionStart = value.length) {
  return { target: { value, selectionStart } } as React.ChangeEvent<HTMLInputElement>;
}

// ─── Display value ────────────────────────────────────────────────────────────

describe("useCurrencyInput — display value", () => {
  it("shows empty string when value is empty", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "", onChange: vi.fn() }),
    );
    expect(result.current.value).toBe("");
  });

  it("adds thousand-separator commas to an integer", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "1030000", onChange: vi.fn() }),
    );
    expect(result.current.value).toBe("1,030,000");
  });

  it("does not append decimal places when none were typed", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "500000", onChange: vi.fn() }),
    );
    expect(result.current.value).not.toContain(".");
  });

  it("preserves the decimal exactly as typed — .4 stays .4, not .40", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "1030000.4", onChange: vi.fn() }),
    );
    expect(result.current.value).toBe("1,030,000.4");
  });

  it("preserves longer decimals without truncation", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "1030000.125", onChange: vi.fn() }),
    );
    expect(result.current.value).toBe("1,030,000.125");
  });

  it("formats small numbers without unnecessary commas", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "500", onChange: vi.fn() }),
    );
    expect(result.current.value).toBe("500");
  });

  it("formats exactly 1,000", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "1000", onChange: vi.fn() }),
    );
    expect(result.current.value).toBe("1,000");
  });
});

// ─── Input cleaning (onChange) ────────────────────────────────────────────────

describe("useCurrencyInput — onChange cleaning", () => {
  it("strips commas from the formatted display before passing to onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "1030000", onChange }),
    );
    act(() => result.current.onChange(changeEvent("1,030,000")));
    expect(onChange).toHaveBeenCalledWith("1030000");
  });

  it("rejects non-numeric characters", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "", onChange }),
    );
    act(() => result.current.onChange(changeEvent("abc")));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("strips letters mixed with digits", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "", onChange }),
    );
    act(() => result.current.onChange(changeEvent("100abc200")));
    expect(onChange).toHaveBeenCalledWith("100200");
  });

  it("rejects the negative sign", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "", onChange }),
    );
    act(() => result.current.onChange(changeEvent("-100000")));
    expect(onChange).toHaveBeenCalledWith("100000");
  });

  it("allows a single decimal point", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "", onChange }),
    );
    act(() => result.current.onChange(changeEvent("1030000.4")));
    expect(onChange).toHaveBeenCalledWith("1030000.4");
  });

  it("collapses multiple decimal points to the first one", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "", onChange }),
    );
    act(() => result.current.onChange(changeEvent("1.2.3")));
    expect(onChange).toHaveBeenCalledWith("1.23");
  });

  it("passes an empty string when the field is cleared", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "1000", onChange }),
    );
    act(() => result.current.onChange(changeEvent("")));
    expect(onChange).toHaveBeenCalledWith("");
  });
});

// ─── onBlur callback ──────────────────────────────────────────────────────────

describe("useCurrencyInput — onBlur callback", () => {
  it("calls the provided onBlur when the input loses focus", () => {
    const onBlur = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "1000", onChange: vi.fn(), onBlur }),
    );
    act(() => result.current.onBlur());
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("does not throw when no onBlur is provided", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "1000", onChange: vi.fn() }),
    );
    expect(() => act(() => result.current.onBlur())).not.toThrow();
  });
});

// ─── Returned props ───────────────────────────────────────────────────────────

describe("useCurrencyInput — returned props", () => {
  it("returns type=text so the browser renders a plain text field", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "", onChange: vi.fn() }),
    );
    expect(result.current.type).toBe("text");
  });

  it("returns inputMode=decimal for the correct mobile keyboard", () => {
    const { result } = renderHook(() =>
      useCurrencyInput({ value: "", onChange: vi.fn() }),
    );
    expect(result.current.inputMode).toBe("decimal");
  });
});
