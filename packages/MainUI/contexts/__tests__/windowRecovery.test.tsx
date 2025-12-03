import { renderHook, act } from "@testing-library/react";
import WindowProvider, { useWindowContext } from "../window";
import { useGlobalUrlStateRecovery } from "@/hooks/useGlobalUrlStateRecovery";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/window",
}));

// Mock recovery hook
jest.mock("@/hooks/useGlobalUrlStateRecovery");

const mockUseGlobalUrlStateRecovery = useGlobalUrlStateRecovery as jest.Mock;

describe("WindowProvider Recovery Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockUseGlobalUrlStateRecovery.mockReturnValue({
      recoveredWindows: [],
      isRecoveryLoading: false,
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });
  });

  it("should preserve existing window state when recovering new windows", () => {
    // 1. Initial state: Window 1 is open with some state (e.g. selected record)
    const { result, rerender } = renderHook(() => useWindowContext(), {
      wrapper: WindowProvider,
    });

    act(() => {
      result.current.setWindowActive({
        windowIdentifier: "window1",
        windowData: { title: "Window 1" },
      });
      // Set some specific state that would be lost if overwritten
      result.current.setSelectedRecord("window1", "tab1", "record1");
    });

    // Verify initial state
    expect(result.current.getSelectedRecord("window1", "tab1")).toBe("record1");
    expect(result.current.getAllWindowsIdentifiers()).toEqual(["window1"]);

    // 2. Simulate recovery: Window 1 (fresh/default) and Window 2 (new)
    // The recovery hook returns a "fresh" Window 1 (no selected record) and a new Window 2
    const recoveredWindows = [
      {
        windowIdentifier: "window1",
        windowId: "w1",
        isActive: false,
        title: "Window 1 Recovered", // Different title to prove we kept the old one? Or just check selectedRecord
        tabs: {
          tab1: {
            table: { filters: [], visibility: {}, sorting: [], order: [] },
            form: {},
            // Missing selectedRecord
          },
        },
      },
      {
        windowIdentifier: "window2",
        windowId: "w2",
        isActive: true,
        title: "Window 2",
        tabs: {},
      },
    ];

    mockUseGlobalUrlStateRecovery.mockReturnValue({
      recoveredWindows,
      isRecoveryLoading: false, // Recovery finished
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });

    // Rerender to trigger useEffect
    rerender();

    // 3. Verify:
    // - Window 1 should still have "record1" selected (preserved)
    // - Window 2 should be added

    // Check Window 1
    expect(result.current.getSelectedRecord("window1", "tab1")).toBe("record1");
    // Also check title to see if it was overwritten or not.
    // If we preserve the whole object, title should be "Window 1" (from setWindowActive), not "Window 1 Recovered".
    expect(result.current.getActiveWindowProperty("title")).not.toBe("Window 1 Recovered");

    // Check Window 2
    expect(result.current.getAllWindowsIdentifiers()).toContain("window2");
    const window2 = result.current.getAllWindows().find((w) => w.windowIdentifier === "window2");
    expect(window2).toBeDefined();
    expect(window2?.title).toBe("Window 2");
  });
});
