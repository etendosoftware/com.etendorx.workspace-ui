import { renderHook, act } from "@testing-library/react";
import { useExpandedMenuItems } from "../useExpandedMenuItems";

// Mock useLocalStorage
const mockStorageState: Record<string, any> = {};
jest.mock("@workspaceui/componentlibrary/src/hooks/useLocalStorage", () => ({
  useLocalStorage: <T>(key: string, initial: T) => {
    if (!(key in mockStorageState)) mockStorageState[key] = initial;
    const setState = (fn: any) => {
      mockStorageState[key] = typeof fn === "function" ? fn(mockStorageState[key]) : fn;
    };
    return [mockStorageState[key], setState] as const;
  },
}));

beforeEach(() => {
  for (const key of Object.keys(mockStorageState)) delete mockStorageState[key];
});

describe("useExpandedMenuItems", () => {
  it("returns empty set when no persisted state exists", () => {
    const { result } = renderHook(() => useExpandedMenuItems("role1"));
    expect(result.current.expandedItems.size).toBe(0);
  });

  it("persists expanded items and restores them", () => {
    const { result, rerender } = renderHook(({ roleId }) => useExpandedMenuItems(roleId), {
      initialProps: { roleId: "role1" },
    });

    act(() => {
      result.current.setExpandedItems(new Set(["menu1", "menu2"]));
    });

    rerender({ roleId: "role1" });
    expect(result.current.expandedItems).toEqual(new Set(["menu1", "menu2"]));
  });

  it("isolates state by role", () => {
    const { result, rerender } = renderHook(({ roleId }) => useExpandedMenuItems(roleId), {
      initialProps: { roleId: "role1" },
    });

    act(() => {
      result.current.setExpandedItems(new Set(["menuA"]));
    });

    rerender({ roleId: "role2" });
    expect(result.current.expandedItems.size).toBe(0);

    rerender({ roleId: "role1" });
    expect(result.current.expandedItems).toEqual(new Set(["menuA"]));
  });
});
