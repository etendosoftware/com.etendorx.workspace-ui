import { useMetadataZustandStore } from "../metadataStore";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("@/utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockMetadata = Metadata as jest.Mocked<typeof Metadata>;

describe("metadataStore loadWindowData deduplication", () => {
  beforeEach(() => {
    useMetadataZustandStore.getState().resetForRole();
    jest.clearAllMocks();
  });

  it("should return the same promise for concurrent loadWindowData calls", async () => {
    const mockWindowData = { id: "win-1", tabs: [] };
    mockMetadata.clearWindowCache.mockImplementation(() => {});
    mockMetadata.forceWindowReload.mockResolvedValue(mockWindowData as any);

    const { loadWindowData } = useMetadataZustandStore.getState();

    const promise1 = loadWindowData("win-1");
    const promise2 = loadWindowData("win-1");

    expect(promise1).toBe(promise2);

    const [r1, r2] = await Promise.all([promise1, promise2]);
    expect(r1).toEqual(mockWindowData);
    expect(r2).toEqual(mockWindowData);
    expect(mockMetadata.forceWindowReload).toHaveBeenCalledTimes(1);
  });

  it("should allow a new request after the previous one completes", async () => {
    const mockWindowData = { id: "win-1", tabs: [] };
    mockMetadata.clearWindowCache.mockImplementation(() => {});
    mockMetadata.forceWindowReload.mockResolvedValue(mockWindowData as any);

    const store = useMetadataZustandStore.getState();
    await store.loadWindowData("win-1");
    store.resetForRole();

    await useMetadataZustandStore.getState().loadWindowData("win-1");
    expect(mockMetadata.forceWindowReload).toHaveBeenCalledTimes(2);
  });

  it("should clean up loading promise on error", async () => {
    mockMetadata.clearWindowCache.mockImplementation(() => {});
    mockMetadata.forceWindowReload.mockRejectedValueOnce(new Error("fail"));

    const { loadWindowData } = useMetadataZustandStore.getState();
    await expect(loadWindowData("win-1")).rejects.toThrow("fail");

    mockMetadata.forceWindowReload.mockResolvedValueOnce({ id: "win-1", tabs: [] } as any);
    await useMetadataZustandStore.getState().loadWindowData("win-1");
    expect(mockMetadata.forceWindowReload).toHaveBeenCalledTimes(2);
  });
});
