import { prefetchStore } from "../prefetchStore";

describe("prefetchStore", () => {
  beforeEach(() => {
    prefetchStore.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should store and retrieve a promise", () => {
    const promise = Promise.resolve({ data: "test" });
    prefetchStore.set("entity-1", promise);

    expect(prefetchStore.get("entity-1")).toBe(promise);
  });

  it("should return undefined for non-existent keys", () => {
    expect(prefetchStore.get("missing")).toBeUndefined();
  });

  it("should consume (delete) on get", () => {
    const promise = Promise.resolve({ data: "test" });
    prefetchStore.set("entity-1", promise);

    prefetchStore.get("entity-1"); // first get consumes
    expect(prefetchStore.get("entity-1")).toBeUndefined();
  });

  it("should auto-expire entries after TTL", () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);

    const promise = Promise.resolve({ data: "test" });
    prefetchStore.set("entity-1", promise);

    // Advance Date.now past the 30s TTL
    (Date.now as jest.Mock).mockReturnValue(now + 30_001);

    expect(prefetchStore.get("entity-1")).toBeUndefined();
  });

  it("should clear all entries", () => {
    prefetchStore.set("a", Promise.resolve(1));
    prefetchStore.set("b", Promise.resolve(2));
    prefetchStore.clear();

    expect(prefetchStore.get("a")).toBeUndefined();
    expect(prefetchStore.get("b")).toBeUndefined();
  });
});
