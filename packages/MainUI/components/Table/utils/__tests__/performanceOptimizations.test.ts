import {
  debounce,
  throttle,
  calculateVisibleRange,
  LazyLoadingManager,
  createLazyLoadingManager,
  MemoryManager,
} from "../performanceOptimizations";

jest.mock("@/utils/logger", () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------
describe("debounce", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("delays function execution by the specified delay", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets timer when called multiple times", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);
    debounced();
    debounced();
    debounced();
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes arguments to the debounced function", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced("a", "b");
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a", "b");
  });
});

// ---------------------------------------------------------------------------
// throttle
// ---------------------------------------------------------------------------
describe("throttle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("executes function immediately on first call", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("skips calls within the interval", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("schedules trailing call when invoked during cooldown", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);
    throttled();
    throttled(); // scheduled for trailing
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("allows execution again after interval has passed", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);
    throttled();
    jest.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// calculateVisibleRange
// ---------------------------------------------------------------------------
describe("calculateVisibleRange", () => {
  it("calculates correct range for scrollTop=0", () => {
    const result = calculateVisibleRange(0, { itemHeight: 50, containerHeight: 300, overscan: 2 }, 100);
    expect(result.startIndex).toBe(0);
    expect(result.visibleItems).toBe(6); // ceil(300/50)
  });

  it("calculates start index with overscan when scrolled", () => {
    const result = calculateVisibleRange(200, { itemHeight: 50, containerHeight: 300, overscan: 2 }, 100);
    expect(result.startIndex).toBe(2); // floor(200/50) - 2 = 2
  });

  it("clamps endIndex to totalItems - 1", () => {
    const result = calculateVisibleRange(0, { itemHeight: 50, containerHeight: 10000, overscan: 0 }, 5);
    expect(result.endIndex).toBe(4);
  });

  it("clamps startIndex to 0 when overscan exceeds position", () => {
    const result = calculateVisibleRange(0, { itemHeight: 50, containerHeight: 300, overscan: 10 }, 100);
    expect(result.startIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// LazyLoadingManager
// ---------------------------------------------------------------------------
describe("LazyLoadingManager", () => {
  it("isEditorLoaded returns false for unknown editor", () => {
    const mgr = new LazyLoadingManager();
    expect(mgr.isEditorLoaded("editor1")).toBe(false);
  });

  it("loadEditor resolves and marks editor as loaded", async () => {
    const mgr = new LazyLoadingManager();
    const loader = jest.fn().mockResolvedValue({ component: "MockEditor" });
    await mgr.loadEditor("editor1", loader);
    expect(mgr.isEditorLoaded("editor1")).toBe(true);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("loadEditor returns cached result without calling loader again", async () => {
    const mgr = new LazyLoadingManager();
    const loader = jest.fn().mockResolvedValue({});
    await mgr.loadEditor("editor1", loader);
    await mgr.loadEditor("editor1", loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("loadEditor deduplicates concurrent loads", async () => {
    const mgr = new LazyLoadingManager();
    const loader = jest.fn().mockResolvedValue({});
    const [p1, p2] = await Promise.all([mgr.loadEditor("ed", loader), mgr.loadEditor("ed", loader)]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("loadEditor propagates loader errors", async () => {
    const mgr = new LazyLoadingManager();
    const loader = jest.fn().mockRejectedValue(new Error("load failed"));
    await expect(mgr.loadEditor("editor1", loader)).rejects.toThrow("load failed");
    expect(mgr.isEditorLoaded("editor1")).toBe(false);
  });

  it("clearLoadedEditors resets all state", async () => {
    const mgr = new LazyLoadingManager();
    await mgr.loadEditor("ed", jest.fn().mockResolvedValue({}));
    mgr.clearLoadedEditors();
    expect(mgr.isEditorLoaded("ed")).toBe(false);
  });

  it("createLazyLoadingManager returns a new instance", () => {
    const mgr = createLazyLoadingManager();
    expect(mgr).toBeInstanceOf(LazyLoadingManager);
  });
});

// ---------------------------------------------------------------------------
// MemoryManager
// ---------------------------------------------------------------------------
describe("MemoryManager", () => {
  it("set and get returns stored value", () => {
    const mgr = new MemoryManager();
    mgr.set("key1", { value: 42 });
    expect(mgr.get("key1")).toEqual({ value: 42 });
  });

  it("get returns undefined for missing key", () => {
    const mgr = new MemoryManager();
    expect(mgr.get("missing")).toBeUndefined();
  });

  it("delete removes an item", () => {
    const mgr = new MemoryManager();
    mgr.set("key1", "data");
    mgr.delete("key1");
    expect(mgr.get("key1")).toBeUndefined();
  });

  it("delete is a no-op for missing key", () => {
    const mgr = new MemoryManager();
    expect(() => mgr.delete("nonexistent")).not.toThrow();
  });

  it("clear empties the cache", () => {
    const mgr = new MemoryManager();
    mgr.set("a", 1);
    mgr.set("b", 2);
    mgr.clear();
    expect(mgr.get("a")).toBeUndefined();
    expect(mgr.getStats().items).toBe(0);
  });

  it("getStats returns correct item count and size", () => {
    const mgr = new MemoryManager();
    mgr.set("k1", "hello");
    const stats = mgr.getStats();
    expect(stats.items).toBe(1);
    expect(stats.size).toBeGreaterThan(0);
  });

  it("overwriting a key updates size correctly", () => {
    const mgr = new MemoryManager();
    mgr.set("key", "small");
    const sizeBefore = mgr.getStats().size;
    mgr.set("key", "much larger value to replace");
    const sizeAfter = mgr.getStats().size;
    expect(sizeAfter).toBeGreaterThan(sizeBefore);
  });
});
