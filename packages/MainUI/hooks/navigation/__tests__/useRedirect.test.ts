/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook, act } from "@testing-library/react";
import { useRedirect } from "../useRedirect";

// Mock dependencies
const mockSetWindowActive = jest.fn();
const mockGetNewWindowIdentifier = jest.fn();
const mockCreateDefaultTabState = jest.fn();
const mockGetCachedMenu = jest.fn();
const mockGetWindow = jest.fn();

jest.mock("@/contexts/window", () => ({
  useWindowContext: () => ({
    setWindowActive: mockSetWindowActive,
  }),
}));

jest.mock("@/utils/window/utils", () => ({
  getNewWindowIdentifier: (id: string) => mockGetNewWindowIdentifier(id),
  createDefaultTabState: (level: number) => mockCreateDefaultTabState(level),
}));

jest.mock("@/utils/url/constants", () => ({
  FORM_MODES: { EDIT: "EDIT", NEW: "NEW", VIEW: "VIEW" },
  TAB_MODES: { FORM: "FORM", GRID: "GRID" },
}));

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    getCachedMenu: () => mockGetCachedMenu(),
    getWindow: (id: string) => mockGetWindow(id),
    client: { request: jest.fn() },
    registerInterceptor: jest.fn(),
  },
}));

describe("useRedirect", () => {
  // ============================================================================
  // Test Setup
  // ============================================================================

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNewWindowIdentifier.mockReturnValue("window-123_1234567890");
    mockCreateDefaultTabState.mockReturnValue({ expanded: false, loading: false });
  });

  // ============================================================================
  // Test Helpers
  // ============================================================================

  interface RedirectParams {
    windowId: string;
    windowTitle: string;
    referencedTabId: string;
    selectedRecordId?: string;
    tabLevel?: number;
  }

  const createMockEvent = () => ({
    stopPropagation: jest.fn(),
    preventDefault: jest.fn(),
  });

  const createClickEvent = () => createMockEvent() as unknown as React.MouseEvent;

  const createKeyboardEvent = (key: string) =>
    ({
      ...createMockEvent(),
      key,
    }) as unknown as React.KeyboardEvent;

  const defaultParams: RedirectParams = {
    windowId: "window-123",
    windowTitle: "Test Window",
    referencedTabId: "tab-456",
    selectedRecordId: "record-789",
    tabLevel: 0,
  };

  // ============================================================================
  // Hook Initialization Tests
  // ============================================================================

  describe("initialization", () => {
    it("should return handleClickRedirect function", () => {
      const { result } = renderHook(() => useRedirect());

      expect(result.current.handleClickRedirect).toBeDefined();
      expect(typeof result.current.handleClickRedirect).toBe("function");
    });

    it("should return handleKeyDownRedirect function", () => {
      const { result } = renderHook(() => useRedirect());

      expect(result.current.handleKeyDownRedirect).toBeDefined();
      expect(typeof result.current.handleKeyDownRedirect).toBe("function");
    });
  });

  // ============================================================================
  // handleClickRedirect Tests
  // ============================================================================

  describe("handleClickRedirect", () => {
    it("should stop event propagation", () => {
      const { result } = renderHook(() => useRedirect());
      const event = createClickEvent();

      act(() => {
        result.current.handleClickRedirect({ e: event, ...defaultParams });
      });

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("should prevent default event behavior", () => {
      const { result } = renderHook(() => useRedirect());
      const event = createClickEvent();

      act(() => {
        result.current.handleClickRedirect({ e: event, ...defaultParams });
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should call setWindowActive with correct data", () => {
      const { result } = renderHook(() => useRedirect());
      const event = createClickEvent();

      act(() => {
        result.current.handleClickRedirect({ e: event, ...defaultParams });
      });

      expect(mockSetWindowActive).toHaveBeenCalledWith({
        windowIdentifier: "window-123_1234567890",
        windowData: expect.objectContaining({
          title: "Test Window",
          tabs: expect.objectContaining({
            "tab-456": expect.objectContaining({
              form: expect.objectContaining({
                recordId: "record-789",
                mode: "FORM",
                formMode: "EDIT",
              }),
              selectedRecord: "record-789",
            }),
          }),
        }),
      });
    });

    it("should not call setWindowActive when windowId is empty", () => {
      const { result } = renderHook(() => useRedirect());
      const event = createClickEvent();

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      act(() => {
        result.current.handleClickRedirect({ e: event, ...defaultParams, windowId: "" });
      });

      expect(mockSetWindowActive).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("No windowId found");

      consoleSpy.mockRestore();
    });

    it("should use tabLevel 0 as default", () => {
      const { result } = renderHook(() => useRedirect());
      const event = createClickEvent();
      const { tabLevel, ...paramsWithoutLevel } = defaultParams;

      act(() => {
        result.current.handleClickRedirect({ e: event, ...paramsWithoutLevel });
      });

      expect(mockCreateDefaultTabState).toHaveBeenCalledWith(0);
    });

    it("should use provided tabLevel", () => {
      const { result } = renderHook(() => useRedirect());
      const event = createClickEvent();

      act(() => {
        result.current.handleClickRedirect({ e: event, ...defaultParams, tabLevel: 2 });
      });

      expect(mockCreateDefaultTabState).toHaveBeenCalledWith(2);
    });
  });

  // ============================================================================
  // handleKeyDownRedirect Tests
  // ============================================================================

  describe("handleKeyDownRedirect", () => {
    describe("event handling", () => {
      it("should always stop propagation", () => {
        const { result } = renderHook(() => useRedirect());
        const event = createKeyboardEvent("Tab");

        act(() => {
          result.current.handleKeyDownRedirect({ e: event, ...defaultParams });
        });

        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it("should always prevent default", () => {
        const { result } = renderHook(() => useRedirect());
        const event = createKeyboardEvent("Tab");

        act(() => {
          result.current.handleKeyDownRedirect({ e: event, ...defaultParams });
        });

        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    describe("trigger keys", () => {
      it.each([
        { key: "Enter", shouldTrigger: true },
        { key: " ", shouldTrigger: true },
      ])("should trigger redirect for '$key' key", ({ key, shouldTrigger }) => {
        const { result } = renderHook(() => useRedirect());
        const event = createKeyboardEvent(key);

        act(() => {
          result.current.handleKeyDownRedirect({ e: event, ...defaultParams });
        });

        if (shouldTrigger) {
          expect(mockSetWindowActive).toHaveBeenCalled();
        } else {
          expect(mockSetWindowActive).not.toHaveBeenCalled();
        }
      });

      it.each([{ key: "Tab" }, { key: "Escape" }, { key: "ArrowDown" }, { key: "a" }])(
        "should NOT trigger redirect for '$key' key",
        ({ key }) => {
          const { result } = renderHook(() => useRedirect());
          const event = createKeyboardEvent(key);

          act(() => {
            result.current.handleKeyDownRedirect({ e: event, ...defaultParams });
          });

          expect(mockSetWindowActive).not.toHaveBeenCalled();
        }
      );
    });

    it("should call setWindowActive with correct data when Enter is pressed", () => {
      const { result } = renderHook(() => useRedirect());
      const event = createKeyboardEvent("Enter");

      act(() => {
        result.current.handleKeyDownRedirect({ e: event, ...defaultParams });
      });

      expect(mockSetWindowActive).toHaveBeenCalledWith({
        windowIdentifier: "window-123_1234567890",
        windowData: expect.objectContaining({
          title: "Test Window",
        }),
      });
    });
  });

  // ============================================================================
  // Callback Stability Tests
  // ============================================================================

  describe("callback stability", () => {
    it("should maintain stable function references across rerenders", () => {
      const { result, rerender } = renderHook(() => useRedirect());

      const firstClickHandler = result.current.handleClickRedirect;
      const firstKeyHandler = result.current.handleKeyDownRedirect;

      rerender();

      expect(result.current.handleClickRedirect).toBe(firstClickHandler);
      expect(result.current.handleKeyDownRedirect).toBe(firstKeyHandler);
    });
  });

  // ============================================================================
  // handleClientclassNavigation Tests
  // ============================================================================

  describe("handleClientclassNavigation", () => {
    const mockMenu = [
      {
        id: "menu-1",
        name: "Sales Order",
        windowId: "W-SALES",
        children: [],
      },
      {
        id: "menu-2",
        name: "Sales Invoice",
        windowId: "W-INVOICE",
        children: [{ id: "menu-2-1", name: "Invoice Lines", windowId: "W-INV-LINES", children: [] }],
      },
    ];

    const mockWindowMeta = {
      id: "W-SALES",
      name: "Sales Order",
      tabs: [
        { id: "TAB-ROOT", tabLevel: 0, entityName: "Order" },
        { id: "TAB-LINES", tabLevel: 1, entityName: "OrderLine" },
      ],
    };

    beforeEach(() => {
      mockGetCachedMenu.mockReturnValue(mockMenu);
      mockGetWindow.mockResolvedValue(mockWindowMeta);
    });

    it("should be exposed from useRedirect", () => {
      const { result } = renderHook(() => useRedirect());
      expect(result.current.handleClientclassNavigation).toBeDefined();
      expect(typeof result.current.handleClientclassNavigation).toBe("function");
    });

    it("should resolve window by converting clientclass to display name and navigate", async () => {
      const { result } = renderHook(() => useRedirect());

      await act(async () => {
        await result.current.handleClientclassNavigation({
          clientclass: "SalesOrderTabLink",
          recordId: "ORDER-001",
        });
      });

      expect(mockGetCachedMenu).toHaveBeenCalled();
      expect(mockGetWindow).toHaveBeenCalledWith("W-SALES");
      expect(mockSetWindowActive).toHaveBeenCalledWith(
        expect.objectContaining({
          windowData: expect.objectContaining({
            title: "Sales Order",
            tabs: expect.objectContaining({
              "TAB-ROOT": expect.objectContaining({
                form: expect.objectContaining({
                  recordId: "ORDER-001",
                  mode: "FORM",
                  formMode: "EDIT",
                }),
                selectedRecord: "ORDER-001",
              }),
            }),
          }),
        })
      );
    });

    it("should warn and not navigate when no matching menu item found", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const { result } = renderHook(() => useRedirect());

      await act(async () => {
        await result.current.handleClientclassNavigation({
          clientclass: "UnknownEntityTabLink",
          recordId: "RECORD-001",
        });
      });

      expect(mockSetWindowActive).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[useRedirect] Could not find window for clientclass:",
        "UnknownEntityTabLink"
      );
      consoleSpy.mockRestore();
    });

    it("should navigate without tab state when window metadata has no tabs", async () => {
      mockGetWindow.mockResolvedValue({ id: "W-SALES", name: "Sales Order", tabs: [] });
      const { result } = renderHook(() => useRedirect());

      await act(async () => {
        await result.current.handleClientclassNavigation({
          clientclass: "SalesOrderTabLink",
          recordId: "ORDER-002",
        });
      });

      expect(mockSetWindowActive).toHaveBeenCalledWith(
        expect.objectContaining({
          windowData: expect.objectContaining({
            tabs: {},
          }),
        })
      );
    });

    it("should navigate even if getWindow throws, with empty tab state", async () => {
      mockGetWindow.mockRejectedValue(new Error("Network error"));
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const { result } = renderHook(() => useRedirect());

      await act(async () => {
        await result.current.handleClientclassNavigation({
          clientclass: "SalesOrderTabLink",
          recordId: "ORDER-003",
        });
      });

      expect(mockSetWindowActive).toHaveBeenCalledWith(
        expect.objectContaining({
          windowData: expect.objectContaining({ tabs: {} }),
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "[useRedirect] Could not load window metadata for clientclass navigation:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("should find window items nested inside children", async () => {
      const { result } = renderHook(() => useRedirect());

      await act(async () => {
        await result.current.handleClientclassNavigation({
          clientclass: "InvoiceLinesTabLink",
          recordId: "LINE-001",
        });
      });

      expect(mockGetWindow).toHaveBeenCalledWith("W-INV-LINES");
    });
  });
});
