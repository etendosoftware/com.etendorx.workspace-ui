import { renderHook } from "@testing-library/react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useTreeModeMetadata } from "../useTreeModeMetadata";

const buildTab = (overrides: Partial<Tab> = {}): Tab =>
  ({ id: "tab-1", window: "window-1", entityName: "Organization", ...overrides }) as Tab;

describe("useTreeModeMetadata", () => {
  it("derives the tree metadata from the tab metadata", () => {
    const tab = buildTab({ hasTree: true, treeDatasourceId: "ds-1", tableId: "table-1" });

    const { result } = renderHook(() => useTreeModeMetadata(tab));

    expect(result.current.treeMetadata).toEqual({
      supportsTreeMode: true,
      treeEntity: "ds-1",
      referencedTableId: "table-1",
      canMoveNodes: true,
    });
  });

  it("reports no tree support for a tab without tree metadata", () => {
    const { result } = renderHook(() => useTreeModeMetadata(buildTab()));

    expect(result.current.treeMetadata.supportsTreeMode).toBe(false);
  });

  it("keeps the same result while the tab does not change", () => {
    const tab = buildTab();
    const { result, rerender } = renderHook(({ current }) => useTreeModeMetadata(current), {
      initialProps: { current: tab },
    });
    const first = result.current;

    rerender({ current: tab });

    expect(result.current).toBe(first);
  });
});
