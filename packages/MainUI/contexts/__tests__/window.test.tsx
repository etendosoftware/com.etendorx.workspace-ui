/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import React from "react";
import { render, screen, act, cleanup } from "@testing-library/react";
import WindowProvider, { useWindowContext } from "../window";
import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { FORM_MODES, TAB_MODES } from "@/utils/url/constants";
import { readNavigationEntry, withNavigationEntry } from "@/utils/window/browserHistory";
import { useGlobalUrlStateRecovery } from "@/hooks/useGlobalUrlStateRecovery";
import { useRouter, useSearchParams } from "next/navigation";

// Mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/hooks/useGlobalUrlStateRecovery", () => ({
  useGlobalUrlStateRecovery: jest.fn(),
}));

jest.mock("@/utils/window/utils", () => ({
  getWindowIdFromIdentifier: jest.fn((id) => id.split("_")[0]),
  createDefaultTabState: jest.fn(() => ({
    table: { filters: [], visibility: {}, sorting: [], order: [], isImplicitFilterApplied: false },
    form: {},
    level: 0,
  })),
  ensureTabExists: jest.fn((state, winId, tabId) => {
    if (!state[winId]) state[winId] = { tabs: {} };
    if (!state[winId].tabs[tabId]) state[winId].tabs[tabId] = { table: {} };
    return state;
  }),
  updateTableProperty: jest.fn((state, winId, tabId, prop, value) => {
    state[winId].tabs[tabId].table[prop] = value;
    return { ...state };
  }),
}));

jest.mock("@/utils/url/utils", () => ({
  ...jest.requireActual("@/utils/url/utils"),
  buildWindowsUrlParams: jest.fn(() => "mock-params"),
}));

const TestComponent = ({ onResult }: any) => {
  const context = useWindowContext();
  React.useEffect(() => {
    onResult(context);
  }, [context, onResult]);
  return null;
};

describe("WindowProvider", () => {
  const mockRouter = { replace: jest.fn() };
  const mockSearchParams = { toString: jest.fn(() => "") };

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.setState({ windows: {}, isRecoveryLoading: false, recoveryError: null, triggerRecovery: () => {} });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useGlobalUrlStateRecovery as jest.Mock).mockReturnValue({
      recoveredWindows: [],
      isRecoveryLoading: false,
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });
  });

  it("should initialize with empty state", () => {
    render(<WindowProvider>TestContent</WindowProvider>);
    expect(screen.getByText("TestContent")).toBeInTheDocument();
  });

  it("should update state when recoveredWindows change", async () => {
    const recoveredWindows = [{ windowIdentifier: "143_1", windowId: "143", isActive: true, tabs: {} }];
    (useGlobalUrlStateRecovery as jest.Mock).mockReturnValue({
      recoveredWindows,
      isRecoveryLoading: false,
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });

    render(
      <WindowProvider>
        <TestComponent onResult={() => {}} />
      </WindowProvider>
    );

    await act(async () => {
      // Wait for effects
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("window?mock-params"));
  });

  it("mirrors the windows into the URL with the history API, without the router, once on /window", async () => {
    window.history.replaceState(null, "", "/window");
    const replaceState = jest.spyOn(window.history, "replaceState");
    (useGlobalUrlStateRecovery as jest.Mock).mockReturnValue({
      recoveredWindows: [{ windowIdentifier: "143_1", windowId: "143", isActive: true, tabs: {} }],
      isRecoveryLoading: false,
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });

    try {
      render(
        <WindowProvider>
          <TestComponent onResult={() => {}} />
        </WindowProvider>
      );
      await act(async () => {});

      expect(replaceState).toHaveBeenCalledWith(expect.anything(), "", "window?mock-params");
      expect(mockRouter.replace).not.toHaveBeenCalled();
    } finally {
      replaceState.mockRestore();
      window.history.replaceState(null, "", "/");
    }
  });

  describe("browser history", () => {
    const FIRST = "143_1";
    const SECOND = "123_2";

    const renderOnWindowRoute = async (resetHistory = true) => {
      if (resetHistory) window.history.replaceState(null, "", "/window");
      (useGlobalUrlStateRecovery as jest.Mock).mockReturnValue({
        recoveredWindows: [{ windowIdentifier: FIRST, windowId: "143", isActive: true, tabs: {} }],
        isRecoveryLoading: false,
        recoveryError: null,
        triggerRecovery: jest.fn(),
      });
      render(
        <WindowProvider>
          <TestComponent onResult={() => {}} />
        </WindowProvider>
      );
      await act(async () => {});
    };

    afterEach(() => {
      window.history.replaceState(null, "", "/");
    });

    it("adds an entry when another window is opened and tags the one being left", async () => {
      await renderOnWindowRoute();
      const pushState = jest.spyOn(window.history, "pushState");

      try {
        await act(async () => {
          useWindowStore.getState().setWindowActive({ windowIdentifier: SECOND, windowData: { title: "Partner" } });
        });

        expect(pushState).toHaveBeenCalledTimes(1);
        expect(readNavigationEntry(pushState.mock.calls[0][0])).toMatchObject({
          index: 1,
          activeWindowIdentifier: SECOND,
        });
      } finally {
        pushState.mockRestore();
      }
    });

    it("keeps the position of the entry after a reload", async () => {
      await renderOnWindowRoute();
      cleanup();
      useWindowStore.setState({ windows: {} });
      window.history.replaceState(
        withNavigationEntry(null, { index: 7, activeWindowIdentifier: FIRST, form: null }),
        "",
        "/window"
      );

      await renderOnWindowRoute(false);

      expect(readNavigationEntry(window.history.state)?.index).toBe(7);
    });

    it("does not add an entry when a window is closed", async () => {
      await renderOnWindowRoute();
      await act(async () => {
        useWindowStore.getState().setWindowActive({ windowIdentifier: SECOND, windowData: { title: "Partner" } });
      });
      const pushState = jest.spyOn(window.history, "pushState");

      try {
        await act(async () => {
          useWindowStore.getState().cleanupWindow(SECOND);
        });

        expect(pushState).not.toHaveBeenCalled();
      } finally {
        pushState.mockRestore();
      }
    });

    it("brings the previous window back on Back without closing the other one", async () => {
      await renderOnWindowRoute();
      await act(async () => {
        useWindowStore.getState().setWindowActive({ windowIdentifier: SECOND, windowData: { title: "Partner" } });
      });

      await act(async () => {
        window.dispatchEvent(
          new PopStateEvent("popstate", {
            state: withNavigationEntry(null, { index: 0, activeWindowIdentifier: FIRST, form: null }),
          })
        );
      });

      const { windows } = useWindowStore.getState();
      expect(windows[FIRST].isActive).toBe(true);
      expect(windows[SECOND]).toBeDefined();
      expect(windows[SECOND].isActive).toBe(false);
    });

    it("adds no entry while walking over the steps of a window that was closed", async () => {
      await renderOnWindowRoute();
      await act(async () => {
        useWindowStore.getState().setWindowActive({ windowIdentifier: SECOND, windowData: { title: "Partner" } });
      });
      await act(async () => {
        useWindowStore.getState().setWindowActive({ windowIdentifier: FIRST });
      });
      await act(async () => {
        useWindowStore.getState().cleanupWindow(SECOND);
      });
      const go = jest.spyOn(window.history, "go").mockImplementation(() => {});
      const pushState = jest.spyOn(window.history, "pushState");

      try {
        await act(async () => {
          window.dispatchEvent(
            new PopStateEvent("popstate", {
              state: withNavigationEntry(null, { index: 1, activeWindowIdentifier: SECOND, form: null }),
            })
          );
        });
        // The store changes while the history is still walking: it is not a new place
        await act(async () => {
          useWindowStore.setState({ windows: { ...useWindowStore.getState().windows } });
        });

        expect(go).toHaveBeenCalledWith(-1);
        expect(pushState).not.toHaveBeenCalled();
      } finally {
        pushState.mockRestore();
        go.mockRestore();
      }
    });

    it("asks before leaving a form with unsaved changes and adds no entry while it waits", async () => {
      await renderOnWindowRoute();
      await act(async () => {
        const store = useWindowStore.getState();
        store.setSelectedRecord(FIRST, "tab1", "rec1", 0);
        store.setTabFormState(FIRST, "tab1", { recordId: "rec1", mode: TAB_MODES.FORM, formMode: FORM_MODES.EDIT }, 0);
      });
      const openRequest = jest.spyOn(useUnsavedChangesStore.getState(), "openRequest").mockImplementation(() => {});
      await act(async () => {
        useWindowStore.setState({ dirtyWindows: { [FIRST]: { "form:tab1": true } } });
      });
      const pushState = jest.spyOn(window.history, "pushState");

      try {
        await act(async () => {
          window.dispatchEvent(
            new PopStateEvent("popstate", {
              state: withNavigationEntry(null, { index: 0, activeWindowIdentifier: FIRST, form: null }),
            })
          );
        });
        // The store changes while the modal is open (here, the dirty flag): still the same place for the history
        await act(async () => {
          useWindowStore.setState({ windows: { ...useWindowStore.getState().windows } });
        });

        expect(openRequest).toHaveBeenCalledTimes(1);
        expect(pushState).not.toHaveBeenCalled();
      } finally {
        pushState.mockRestore();
        openRequest.mockRestore();
      }
    });
  });

  it("should not sync to URL if isRecoveryLoading is true", async () => {
    (useGlobalUrlStateRecovery as jest.Mock).mockReturnValue({
      recoveredWindows: [{ windowIdentifier: "143_1" }],
      isRecoveryLoading: true,
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });

    render(
      <WindowProvider>
        <TestComponent onResult={() => {}} />
      </WindowProvider>
    );

    await act(async () => {
      // Wait for effects
    });

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("should provide context methods to children", () => {
    const mockOnResult = jest.fn();
    render(
      <WindowProvider>
        <TestComponent onResult={mockOnResult} />
      </WindowProvider>
    );

    expect(mockOnResult).toHaveBeenCalledWith(
      expect.objectContaining({
        setWindowActive: expect.any(Function),
        getTableState: expect.any(Function),
      })
    );
  });
});
