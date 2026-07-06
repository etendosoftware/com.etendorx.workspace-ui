import { Metadata } from "../metadata";

jest.mock("../cache", () => ({
  CacheStore: jest.fn().mockImplementation(() => {
    const store = new Map();
    return {
      get: jest.fn((key) => store.get(key)),
      set: jest.fn((key, value) => store.set(key, value)),
      clear: jest.fn(() => store.clear()),
      delete: jest.fn((key) => store.delete(key)),
    };
  }),
}));

describe("Metadata in-flight deduplication", () => {
  let postSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (Metadata as any).currentRoleId = null;
    (Metadata as any).cache.clear();
    (Metadata as any).pendingRequests?.clear();

    postSpy = jest.spyOn(Metadata.client, "post").mockResolvedValue({
      data: { tabs: [] },
      ok: true,
    } as any);

    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: jest.fn(() => "test-role"),
        setItem: jest.fn(),
        clear: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it("should return the same promise for concurrent _getWindow calls with same windowId", async () => {
    const promise1 = Metadata.forceWindowReload("win-1");
    const promise2 = Metadata.forceWindowReload("win-1");

    expect(promise1).toBe(promise2);
    expect(postSpy).toHaveBeenCalledTimes(1);

    await Promise.all([promise1, promise2]);
  });

  it("should make separate requests for different windowIds", async () => {
    const promise1 = Metadata.forceWindowReload("win-1");
    const promise2 = Metadata.forceWindowReload("win-2");

    expect(promise1).not.toBe(promise2);
    expect(postSpy).toHaveBeenCalledTimes(2);

    await Promise.all([promise1, promise2]);
  });

  it("should allow a new request after the previous one resolves", async () => {
    await Metadata.forceWindowReload("win-1");
    expect(postSpy).toHaveBeenCalledTimes(1);

    await Metadata.forceWindowReload("win-1");
    expect(postSpy).toHaveBeenCalledTimes(2);
  });

  it("should clean up pending request on error", async () => {
    postSpy.mockRejectedValueOnce(new Error("Network error"));

    await expect(Metadata.forceWindowReload("win-1")).rejects.toThrow("Network error");

    postSpy.mockResolvedValueOnce({ data: { tabs: [] }, ok: true } as any);
    await Metadata.forceWindowReload("win-1");
    expect(postSpy).toHaveBeenCalledTimes(2);
  });

  it("should deduplicate concurrent getToolbar calls", async () => {
    postSpy.mockResolvedValue({
      data: { response: { data: [{ id: "t1", windows: ["w1"] }] } },
    } as any);

    const promise1 = Metadata.getToolbar();
    const promise2 = Metadata.getToolbar();

    const [r1, r2] = await Promise.all([promise1, promise2]);
    expect(r1).toEqual(r2);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });
});
