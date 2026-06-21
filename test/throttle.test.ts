import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { throttle } from "../src/index.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("throttle", () => {
  it("fires immediately on the leading edge by default", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("invokes at most once per interval, with a trailing call for the tail", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    // Burst of calls within the first interval.
    t(); // leading → call #1
    t();
    t();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2); // trailing → call #2
  });

  it("paces a steady stream to one call per interval", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    for (let i = 0; i < 10; i++) {
      t();
      vi.advanceTimersByTime(50); // 500ms total
    }
    vi.advanceTimersByTime(100);
    // ~500ms / 100ms interval ≈ 5–6 invocations, never 10.
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(fn.mock.calls.length).toBeLessThan(10);
  });

  it("leading:false suppresses the immediate call", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100, { leading: false });
    t();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancel and flush work like debounce", () => {
    const fn = vi.fn((x: number) => x);
    const t = throttle(fn, 100, { leading: false });
    t(7);
    expect(t.pending()).toBe(true);
    expect(t.flush()).toBe(7);
    expect(t.pending()).toBe(false);

    t(9);
    t.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1); // only the flushed call
  });

  it("respects an AbortSignal", () => {
    const fn = vi.fn();
    const ac = new AbortController();
    const t = throttle(fn, 100, { leading: false, signal: ac.signal });
    t();
    ac.abort();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});
