import { syncReconstructedHierarchyToSession } from "../reconstructedSessionSync";
import { syncSelectedRecordsToSession } from "@/utils/hooks/useTableSelection/sessionSync";
import type { SessionSyncTarget } from "../stateReconstructor";
import type { Tab } from "@workspaceui/api-client/src/api/types";

jest.mock("@/utils/hooks/useTableSelection/sessionSync", () => ({
  syncSelectedRecordsToSession: jest.fn().mockResolvedValue(undefined),
}));

const mockSync = syncSelectedRecordsToSession as jest.Mock;

const tab = (id: string): Tab => ({ id }) as unknown as Tab;

describe("syncReconstructedHierarchyToSession", () => {
  const setSession = jest.fn();
  const setSessionSyncLoading = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("syncs each target in order with a minimal record and its parentId", async () => {
    const targets: SessionSyncTarget[] = [
      { tab: tab("tab1"), recordId: "parent456", parentId: null },
      { tab: tab("tab2"), recordId: "child123", parentId: "parent456" },
    ];

    await syncReconstructedHierarchyToSession(targets, { setSession, setSessionSyncLoading });

    expect(mockSync).toHaveBeenCalledTimes(2);
    // Root first.
    expect(mockSync.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        tab: expect.objectContaining({ id: "tab1" }),
        selectedRecords: [{ id: "parent456" }],
        parentId: undefined,
      })
    );
    // Leaf second, carrying the parent record id.
    expect(mockSync.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        tab: expect.objectContaining({ id: "tab2" }),
        selectedRecords: [{ id: "child123" }],
        parentId: "parent456",
      })
    );
  });

  it("does nothing when there are no targets", async () => {
    await syncReconstructedHierarchyToSession([], { setSession, setSessionSyncLoading });
    expect(mockSync).not.toHaveBeenCalled();
  });
});
