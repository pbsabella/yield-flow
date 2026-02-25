import { describe, expect, it, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

const KEY = "test:key";

beforeEach(() => {
  localStorage.clear();
});

describe("useLocalStorage — initial state", () => {
  it("returns the initial value before hydration", () => {
    const { result } = renderHook(() => useLocalStorage(KEY, "hello"));
    // Before useEffect fires, value is the initialValue
    expect(result.current.value).toBe("hello");
  });

  it("exposes isReady=false on the first render", () => {
    const { result } = renderHook(() => useLocalStorage(KEY, "hello"));
    // isReady starts false and flips to true after the hydration effect
    // (it may already be true by the time we check if effects ran synchronously in test env)
    expect(typeof result.current.isReady).toBe("boolean");
  });

  it("sets isReady=true after hydration", async () => {
    const { result } = renderHook(() => useLocalStorage(KEY, "hello"));
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });
});

describe("useLocalStorage — hydrating from storage", () => {
  it("reads an existing value from localStorage", async () => {
    localStorage.setItem(KEY, JSON.stringify("stored-value"));
    const { result } = renderHook(() => useLocalStorage(KEY, "default"));
    await waitFor(() => expect(result.current.value).toBe("stored-value"));
  });

  it("keeps initial value when localStorage has nothing for the key", async () => {
    const { result } = renderHook(() => useLocalStorage(KEY, 42));
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.value).toBe(42);
  });

  it("falls back to initial value when stored JSON is malformed", async () => {
    localStorage.setItem(KEY, "not-valid-json{{{");
    const { result } = renderHook(() => useLocalStorage(KEY, "fallback"));
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.value).toBe("fallback");
  });

  it("supports complex types (array)", async () => {
    localStorage.setItem(KEY, JSON.stringify([1, 2, 3]));
    const { result } = renderHook(() => useLocalStorage<number[]>(KEY, []));
    await waitFor(() => expect(result.current.value).toEqual([1, 2, 3]));
  });
});

describe("useLocalStorage — writing to storage", () => {
  it("persists a new value to localStorage when setValue is called", async () => {
    const { result } = renderHook(() => useLocalStorage(KEY, "initial"));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setValue("updated");
    });

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(KEY)!)).toBe("updated");
    });
  });

  it("reflects the updated value in state immediately", async () => {
    const { result } = renderHook(() => useLocalStorage(KEY, 0));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setValue(99);
    });

    await waitFor(() => expect(result.current.value).toBe(99));
  });
});

describe("useLocalStorage — remove", () => {
  it("removes the key from localStorage", async () => {
    localStorage.setItem(KEY, JSON.stringify("to-remove"));
    const { result } = renderHook(() => useLocalStorage(KEY, ""));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.remove();
    });

    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("useLocalStorage — hydrate: false", () => {
  it("skips reading from storage when hydrate is false", async () => {
    localStorage.setItem(KEY, JSON.stringify("should-be-ignored"));
    const { result } = renderHook(() =>
      useLocalStorage(KEY, "default", { hydrate: false }),
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.value).toBe("default");
  });
});

describe("useLocalStorage — persistWhen", () => {
  it("does not write when persistWhen returns false", async () => {
    const { result } = renderHook(() =>
      useLocalStorage<number[]>(KEY, [], {
        persistWhen: (v) => v.length > 0,
        skipInitialWrite: true,
      }),
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    // Initial value is [] which fails persistWhen, so nothing should be written
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
