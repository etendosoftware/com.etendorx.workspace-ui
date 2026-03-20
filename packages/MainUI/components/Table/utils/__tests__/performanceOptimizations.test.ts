import {
  debounce,
  throttle,
  LazyLoadingManager,
  createLazyLoadingManager,
  PerformanceMonitor,
  calculateVisibleRange,
  MemoryManager,
} from "../performanceOptimizations";

jest.useFakeTimers();

describe("debounce", () => {
  it("delays function execution", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced("a");
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("cancels previous call when called multiple times", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced("a");
    debounced("b");
    debounced("c");
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });
});

describe("throttle", () => {
  it("executes immediately on first call", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);
    throttled("first");
    expect(fn).toHaveBeenCalledWith("first");
  });

  it("skips rapid subsequent calls", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);
    throttled("first");
    throttled("second");
    throttled("third");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("executes after interval has passed", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);
    throttled("first");
    jest.advanceTimersByTime(110);
    throttled("second");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("LazyLoadingManager", () => {
  it("createLazyLoadingManager returns an instance", () => {
    const manager = createLazyLoadingManager();
    expect(manager).toBeInstanceOf(LazyLoadingManager);
  });

  it("isEditorLoaded returns false for unknown key", () => {
    const manager = new LazyLoadingManager();
    expect(manager.isEditorLoaded("key1")).toBe(false);
  });

  it("loadEditor marks key as loaded after resolution", async () => {
    const manager = new LazyLoadingManager();
    await manager.loadEditor("key1", () => Promise.resolve("result"));
    expect(manager.isEditorLoaded("key1")).toBe(true);
  });

  it("loadEditor returns existing promise for pending key", async () => {
    const manager = new LazyLoadingManager();
    let resolve: (v: any) => void;
    const promise = new Promise((r) => {
      resolve = r;
    });
    const load1 = manager.loadEditor("key1", () => promise);
    const load2 = manager.loadEditor("key1", () => promise);
    resolve!("done");
    await Promise.all([load1, load2]);
  });

  it("loadEditor handles loader failure", async () => {
    const manager = new LazyLoadingManager();
    await expect(manager.loadEditor("key1", () => Promise.reject(new Error("fail")))).rejects.toThrow("fail");
    expect(manager.isEditorLoaded("key1")).toBe(false);
  });

  it("clearLoadedEditors removes all loaded editors", async () => {
    const manager = new LazyLoadingManager();
    await manager.loadEditor("key1", () => Promise.resolve());
    manager.clearLoadedEditors();
    expect(manager.isEditorLoaded("key1")).toBe(false);
  });
});

describe("calculateVisibleRange", () => {
  const config = { itemHeight: 50, containerHeight: 200, overscan: 2 };

  it("calculates start and end indices from scrollTop 0", () => {
    const result = calculateVisibleRange(0, config, 100);
    expect(result.startIndex).toBe(0);
    expect(result.visibleItems).toBe(4);
    expect(result.endIndex).toBe(8); // startIndex(0) + visibleItems(4) + overscan*2(4) = 8
  });

  it("calculates range with scroll offset", () => {
    const result = calculateVisibleRange(100, config, 100);
    expect(result.startIndex).toBe(0); // max(0, floor(100/50) - 2) = max(0, 0) = 0
  });

  it("clamps endIndex to totalItems - 1", () => {
    const result = calculateVisibleRange(0, config, 5);
    expect(result.endIndex).toBe(4);
  });
});

describe("PerformanceMonitor", () => {
  it("measure executes the function and returns result", () => {
    const monitor = new PerformanceMonitor();
    const result = monitor.measure("test", () => 42);
    expect(result).toBe(42);
  });

  it("measureAsync executes async function and returns result", async () => {
    const monitor = new PerformanceMonitor();
    const result = await monitor.measureAsync("test", () => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("measure rethrows errors", () => {
    const monitor = new PerformanceMonitor();
    expect(() =>
      monitor.measure("test", () => {
        throw new Error("boom");
      })
    ).toThrow("boom");
  });

  it("measureAsync rethrows errors", async () => {
    const monitor = new PerformanceMonitor();
    await expect(monitor.measureAsync("test", () => Promise.reject(new Error("async boom")))).rejects.toThrow(
      "async boom"
    );
  });
});

describe("MemoryManager", () => {
  it("set and get work correctly", () => {
    const mm = new MemoryManager();
    mm.set("key1", { data: "value" });
    expect(mm.get("key1")).toEqual({ data: "value" });
  });

  it("get returns undefined for unknown key", () => {
    const mm = new MemoryManager();
    expect(mm.get("missing")).toBeUndefined();
  });

  it("delete removes item", () => {
    const mm = new MemoryManager();
    mm.set("key1", "value");
    mm.delete("key1");
    expect(mm.get("key1")).toBeUndefined();
  });

  it("delete is a no-op for unknown key", () => {
    const mm = new MemoryManager();
    expect(() => mm.delete("missing")).not.toThrow();
  });

  it("clear removes all items", () => {
    const mm = new MemoryManager();
    mm.set("k1", "v1");
    mm.set("k2", "v2");
    mm.clear();
    expect(mm.get("k1")).toBeUndefined();
    expect(mm.getStats().items).toBe(0);
  });

  it("getStats returns correct counts", () => {
    const mm = new MemoryManager();
    mm.set("k1", "val");
    const stats = mm.getStats();
    expect(stats.items).toBe(1);
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.maxSize).toBe(50 * 1024 * 1024);
  });

  it("overwrites existing key", () => {
    const mm = new MemoryManager();
    mm.set("k1", "first");
    mm.set("k1", "second");
    expect(mm.get("k1")).toBe("second");
    expect(mm.getStats().items).toBe(1);
  });
});
