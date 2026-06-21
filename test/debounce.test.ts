import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "../src/index.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("debounce — basics", () => {
  it("invokes once on the trailing edge after the quiet period", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    d();
    d();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets the timer on each call", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    vi.advanceTimersByTime(80);
    d();
    vi.advanceTimersByTime(80);
    expect(fn).not.toHaveBeenCalled(); // timer keeps resetting
    vi.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls fn with the latest args and preserves `this`", () => {
    const fn = vi.fn(function (this: { id: number }, x: number) {
      return this.id + x;
    });
    const ctx = { id: 10, d: debounce(fn, 50) };
    ctx.d(1);
    ctx.d(2);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(2);
    expect(fn.mock.results[0]!.value).toBe(12);
  });
});

describe("debounce — leading / trailing", () => {
  it("leading:true fires immediately, then not again within the window", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true, trailing: false });
    d();
    expect(fn).toHaveBeenCalledTimes(1);
    d();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("leading + trailing fires on both edges when called more than once", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true, trailing: true });
    d();
    d();
    expect(fn).toHaveBeenCalledTimes(1); // leading
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2); // trailing
  });

  it("leading fires only once when called a single time", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { leading: true, trailing: true });
    d();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1); // no extra trailing for a lone call
  });
});

describe("debounce — maxWait", () => {
  it("forces invocation after maxWait even under constant pressure", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { maxWait: 200 });
    // Call every 50ms forever; without maxWait it would never fire.
    for (let i = 0; i < 4; i++) {
      d();
      vi.advanceTimersByTime(50);
    }
    // 200ms elapsed → maxWait forces at least one invocation.
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("debounce — cancel / flush / pending", () => {
  it("cancel drops the pending trailing call", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    expect(d.pending()).toBe(true);
    d.cancel();
    expect(d.pending()).toBe(false);
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it("flush invokes immediately and returns the result", () => {
    const fn = vi.fn((x: number) => x * 2);
    const d = debounce(fn, 100);
    d(21);
    expect(d.pending()).toBe(true);
    expect(d.flush()).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(d.pending()).toBe(false);
  });

  it("flush with nothing pending is a no-op returning the last result", () => {
    const fn = vi.fn((x: number) => x);
    const d = debounce(fn, 100);
    expect(d.flush()).toBeUndefined();
    d(5);
    d.flush();
    expect(d.flush()).toBe(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("debounce — AbortSignal", () => {
  it("aborting cancels a pending call and disables further scheduling", () => {
    const fn = vi.fn();
    const ac = new AbortController();
    const d = debounce(fn, 100, { signal: ac.signal });
    d();
    ac.abort();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    d(); // ignored after abort
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    expect(d.pending()).toBe(false);
  });

  it("an already-aborted signal makes the debounced fn a no-op", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100, { signal: AbortSignal.abort() });
    d();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("debounce — validation", () => {
  it("throws when fn is not a function", () => {
    // @ts-expect-error invalid input
    expect(() => debounce(123, 100)).toThrow(TypeError);
  });
});
